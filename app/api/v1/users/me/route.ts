import type { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  image: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  image: z.string().trim().min(1).max(500).nullable().optional()
});

export async function GET() {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: auth.user.id,
        deletedAt: null
      },
      select: userSelect
    });

    if (!user) {
      return jsonError('Akun tidak ditemukan.', 404);
    }

    return jsonOk(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, updateProfileSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { name, phone, image } = parsed.data;

    if (name === undefined && phone === undefined && image === undefined) {
      return jsonError('Minimal satu field harus diisi.', 422);
    }

    const existing = await prisma.user.findFirst({
      where: {
        id: auth.user.id,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return jsonError('Akun tidak ditemukan.', 404);
    }

    const user = await prisma.user.update({
      where: {
        id: auth.user.id
      },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(image !== undefined ? { image } : {})
      },
      select: userSelect
    });

    return jsonOk(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
