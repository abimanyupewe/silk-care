import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getBoolean,
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
  paginationMeta,
  parseJson
} from '@/lib/api';
import { adminUserSelect, userRoles } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';

// Dokter, fasilitas, dan apotek dibuat lewat onboarding partner (ada profil terkait),
// jadi admin hanya membuat akun pasien atau admin.
const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  phone: z.string().trim().min(8).max(20).optional(),
  role: z.enum(['PATIENT', 'ADMIN']).default('PATIENT')
});

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

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, createUserSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { password, ...data } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            ...data,
            passwordHash,
            // Akun dibuat admin, jadi email dianggap sudah terverifikasi.
            emailVerified: new Date()
          },
          select: adminUserSelect
        });

        await writeAuditLog(
          {
            actorId: auth.user.id,
            action: auditActions.userCreate,
            targetType: 'USER',
            targetId: created.id,
            metadata: {
              email: created.email,
              role: created.role
            },
            request
          },
          tx
        );

        return created;
      });

      return jsonCreated(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return jsonError('Email sudah terdaftar.', 409);
      }

      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
