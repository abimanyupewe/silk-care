import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getBoolean,
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { adminUserSelect, userRoles } from '@/lib/admin';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const role = getEnum(searchParams, 'role', userRoles);
    const deleted = getBoolean(searchParams, 'deleted');
    const pagination = getPagination(searchParams, 20);

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (deleted !== undefined) {
      where.deletedAt = deleted ? { not: null } : null;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminUserSelect
      }),
      prisma.user.count({ where })
    ]);

    return jsonOk(users, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
