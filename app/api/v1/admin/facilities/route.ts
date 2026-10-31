import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
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
import { adminFacilitySelect, verificationStatuses } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { createUniqueFacilitySlug, facilityTypes } from '@/lib/facility';
import { uniqueViolation } from '@/lib/prisma-errors';
import { startTrial } from '@/lib/subscription';

// Admin membuat akun pemilik sekaligus profil fasilitas (mis. apotek yang kesulitan
// mendaftar sendiri). Hasilnya langsung terverifikasi karena dibuat oleh admin.
const createFacilitySchema = z.object({
  owner: z.object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(72),
    phone: z.string().trim().min(8).max(20).optional()
  }),
  facility: z.object({
    name: z.string().trim().min(2).max(150),
    type: z.enum(facilityTypes),
    description: z.string().trim().max(2000).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    phone: z.string().trim().min(8).max(20).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional()
  })
});

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const verificationStatus = getEnum(searchParams, 'verificationStatus', verificationStatuses);
    const type = getEnum(searchParams, 'type', facilityTypes);
    const pagination = getPagination(searchParams, 20);

    const where: Prisma.FacilityWhereInput = {};

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    if (type) {
      where.type = type;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminFacilitySelect
      }),
      prisma.facility.count({ where })
    ]);

    return jsonOk(facilities, paginationMeta(total, pagination));
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

    const parsed = await parseJson(request, createFacilitySchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { owner, facility } = parsed.data;
    const [passwordHash, slug] = await Promise.all([
      bcrypt.hash(owner.password, 12),
      createUniqueFacilitySlug(facility.name)
    ]);
    const role = facility.type === 'PHARMACY' ? 'PHARMACY' : 'FACILITY';

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            passwordHash,
            role,
            // Akun dibuat admin, jadi email dianggap sudah terverifikasi.
            emailVerified: new Date()
          },
          select: { id: true }
        });

        const row = await tx.facility.create({
          data: {
            ...facility,
            slug,
            userId: user.id,
            verificationStatus: 'VERIFIED'
          },
          select: adminFacilitySelect
        });

        // Katalog publik hanya menampilkan mitra dengan langganan aktif.
        await startTrial(tx, user.id, new Date());

        await writeAuditLog(
          {
            actorId: auth.user.id,
            action: auditActions.facilityCreate,
            targetType: 'FACILITY',
            targetId: row.id,
            metadata: {
              userId: user.id,
              email: owner.email,
              type: facility.type
            },
            request
          },
          tx
        );

        return row;
      });

      return jsonCreated(created);
    } catch (error) {
      if (uniqueViolation(error)) {
        return jsonError('Email sudah terdaftar.', 409);
      }

      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
