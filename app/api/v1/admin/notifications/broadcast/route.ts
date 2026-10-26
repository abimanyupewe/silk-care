import { z } from 'zod';
import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonOk, jsonTooManyRequests, parseJson } from '@/lib/api';
import { userRoles } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limit';

const BROADCAST_CHUNK_SIZE = 500;

const broadcastSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(2000),
    audience: z.enum(['ALL', 'ROLE', 'USER']),
    roles: z.array(z.enum(userRoles)).min(1).max(userRoles.length).optional(),
    userIds: z.array(z.string().trim().min(1).max(100)).min(1).max(1000).optional()
  })
  .superRefine((data, context) => {
    if (data.audience === 'ROLE' && !data.roles) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['roles'],
        message: 'roles wajib diisi untuk audience ROLE.'
      });
    }

    if (data.audience === 'USER' && !data.userIds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userIds'],
        message: 'userIds wajib diisi untuk audience USER.'
      });
    }

    if (data.audience === 'ALL' && (data.roles || data.userIds)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['audience'],
        message: 'roles dan userIds tidak boleh diisi untuk audience ALL.'
      });
    }

    if (data.audience === 'ROLE' && data.userIds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userIds'],
        message: 'userIds tidak boleh diisi untuk audience ROLE.'
      });
    }

    if (data.audience === 'USER' && data.roles) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['roles'],
        message: 'roles tidak boleh diisi untuk audience USER.'
      });
    }
  });

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const limit = await rateLimit(`notification:broadcast:${auth.user.id}`, 5, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const parsed = await parseJson(request, broadcastSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { title, body, audience, roles } = parsed.data;
    const userIds = audience === 'USER' ? [...new Set(parsed.data.userIds ?? [])] : undefined;
    const where: Prisma.UserWhereInput = {
      deletedAt: null
    };

    if (audience === 'ROLE' && roles) {
      where.role = {
        in: roles
      };
    }

    if (audience === 'USER' && userIds) {
      where.id = {
        in: userIds
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true
      }
    });
    const metadata: Prisma.InputJsonValue = {
      audience,
      recipients: users.length,
      ...(audience === 'ROLE' && roles ? { roles } : {}),
      ...(audience === 'USER' && userIds ? { userIdCount: userIds.length } : {})
    };

    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < users.length; index += BROADCAST_CHUNK_SIZE) {
        await tx.notification.createMany({
          data: users.slice(index, index + BROADCAST_CHUNK_SIZE).map((user) => ({
            userId: user.id,
            type: 'SYSTEM',
            title,
            body,
            data: {
              broadcast: true,
              audience
            }
          }))
        });
      }

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.notificationBroadcast,
          targetType: 'NOTIFICATION',
          metadata,
          request
        },
        tx
      );
    });

    return jsonOk({
      recipients: users.length,
      audience
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
