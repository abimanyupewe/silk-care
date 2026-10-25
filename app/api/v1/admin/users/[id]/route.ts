import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminUserSelect } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(8).max(20).nullable().optional(),
    role: z.enum(['PATIENT', 'DOCTOR', 'FACILITY', 'PHARMACY', 'ADMIN']).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi.'
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: {
        id
      },
      select: adminUserSelect
    });

    if (!user) {
      return jsonError('Pengguna tidak ditemukan.', 404);
    }

    return jsonOk(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        role: true,
        deletedAt: true,
        doctorProfile: {
          select: {
            id: true
          }
        },
        facility: {
          select: {
            id: true,
            type: true
          }
        }
      }
    });

    if (!user) {
      return jsonError('Pengguna tidak ditemukan.', 404);
    }

    if (user.deletedAt) {
      return jsonError('Akun tidak aktif. Pulihkan akun terlebih dahulu.', 409);
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const nextRole = parsed.data.role;

    if (auth.user.id === user.id && nextRole && nextRole !== user.role) {
      return jsonError('Admin tidak dapat mengubah role akunnya sendiri.', 409);
    }

    if (nextRole) {
      if (nextRole === 'DOCTOR' && !user.doctorProfile) {
        return jsonError('Profil dokter belum tersedia untuk pengguna ini.', 409);
      }

      if ((nextRole === 'FACILITY' || nextRole === 'PHARMACY') && !user.facility) {
        return jsonError('Profil fasilitas belum tersedia untuk pengguna ini.', 409);
      }

      if (nextRole === 'PHARMACY' && user.facility?.type !== 'PHARMACY') {
        return jsonError('Role PHARMACY memerlukan fasilitas bertipe PHARMACY.', 409);
      }

      if (nextRole === 'FACILITY' && user.facility?.type === 'PHARMACY') {
        return jsonError('Fasilitas bertipe PHARMACY harus menggunakan role PHARMACY.', 409);
      }

      if (nextRole !== 'DOCTOR' && user.doctorProfile) {
        return jsonError('Pengguna dengan profil dokter tidak dapat diubah ke role lain.', 409);
      }

      if (nextRole !== 'FACILITY' && nextRole !== 'PHARMACY' && user.facility) {
        return jsonError('Pengguna dengan profil fasilitas tidak dapat diubah ke role lain.', 409);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: {
          id: user.id
        },
        data: parsed.data,
        select: adminUserSelect
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.userUpdate,
          targetType: 'USER',
          targetId: user.id,
          metadata: {
            fields: Object.keys(parsed.data),
            previousRole: user.role,
            role: parsed.data.role ?? user.role
          },
          request
        },
        tx
      );

      return result;
    });

    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;

    if (auth.user.id === id) {
      return jsonError('Admin tidak dapat menonaktifkan akunnya sendiri.', 409);
    }

    const user = await prisma.user.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        deletedAt: true
      }
    });

    if (!user) {
      return jsonError('Pengguna tidak ditemukan.', 404);
    }

    if (user.deletedAt) {
      return jsonOk(
        await prisma.user.findUniqueOrThrow({
          where: {
            id: user.id
          },
          select: adminUserSelect
        })
      );
    }

    const deletedAt = new Date();
    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: {
          id: user.id
        },
        data: {
          deletedAt
        },
        select: adminUserSelect
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.userDelete,
          targetType: 'USER',
          targetId: user.id,
          metadata: {
            deletedAt: deletedAt.toISOString()
          },
          request
        },
        tx
      );

      return result;
    });

    return jsonOk(deleted);
  } catch (error) {
    return handleRouteError(error);
  }
}
