import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { auditActions, writeAuditLog } from '@/lib/audit';
import {
  getBoolean,
  getPagination,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
  paginationMeta,
  parseJson
} from '@/lib/api';
import {
  announcementCreateSchema,
  announcementSelect,
  validateAnnouncementState
} from '@/lib/announcement';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const active = getBoolean(searchParams, 'active');
    const pagination = getPagination(searchParams, 10);
    const where: Prisma.AnnouncementWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        select: announcementSelect
      }),
      prisma.announcement.count({ where })
    ]);

    return jsonOk(announcements, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, announcementCreateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const data = parsed.data;
    const stateError = validateAnnouncementState({
      message: data.message,
      linkLabel: data.linkLabel ?? null,
      linkUrl: data.linkUrl ?? null,
      active: data.active,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null
    });

    if (stateError) {
      return jsonError(stateError, 422);
    }

    try {
      const announcement = await prisma.$transaction(async (tx) => {
        // Satu banner aktif: yang lain dinonaktifkan di transaksi yang sama.
        if (data.active) {
          await tx.announcement.updateMany({ where: { active: true }, data: { active: false } });
        }

        const created = await tx.announcement.create({ data, select: announcementSelect });

        await writeAuditLog(
          {
            actorId: auth.user.id,
            action: auditActions.announcementCreate,
            targetType: 'ANNOUNCEMENT',
            targetId: created.id,
            metadata: { active: created.active },
            request
          },
          tx
        );

        return created;
      });

      return jsonCreated(announcement);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return jsonError('Banner aktif berubah, muat ulang lalu coba lagi.', 409);
      }

      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
