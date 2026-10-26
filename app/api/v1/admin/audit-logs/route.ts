import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { auditTargetTypes } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const actorId = getString(searchParams, 'actorId', 100);
    const action = getString(searchParams, 'action', 100)?.toUpperCase();
    const targetTypeParam = getString(searchParams, 'targetType', 30);
    const targetType = getEnum(searchParams, 'targetType', auditTargetTypes);
    const targetId = getString(searchParams, 'targetId', 100);
    const fromRaw = getString(searchParams, 'from', 40);
    const toRaw = getString(searchParams, 'to', 40);
    const pagination = getPagination(searchParams, 20);

    if (targetTypeParam && !targetType) {
      return jsonError('targetType audit log tidak valid.', 422);
    }

    let from: Date | undefined;
    let to: Date | undefined;

    if (fromRaw) {
      from = new Date(fromRaw);

      if (Number.isNaN(from.getTime())) {
        return jsonError('from harus berupa tanggal yang valid.', 422);
      }
    }

    if (toRaw) {
      to = new Date(toRaw);

      if (Number.isNaN(to.getTime())) {
        return jsonError('to harus berupa tanggal yang valid.', 422);
      }
    }

    if (from && to && from > to) {
      return jsonError('from tidak boleh lebih besar dari to.', 422);
    }

    const where: Prisma.AuditLogWhereInput = {};

    if (actorId) {
      where.actorId = actorId;
    }

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (targetId) {
      where.targetId = targetId;
    }

    if (from || to) {
      where.createdAt = {
        gte: from,
        lte: to
      };
    }

    if (q) {
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { targetType: { contains: q, mode: 'insensitive' } },
        { actor: { name: { contains: q, mode: 'insensitive' } } },
        { actor: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: pagination.skip,
        take: pagination.limit,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return jsonOk(logs, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
