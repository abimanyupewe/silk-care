import { z } from 'zod';
import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonCreated, jsonError, parseJson } from '@/lib/api';
import { auditActions, recordActivity } from '@/lib/audit';
import { createUniqueFacilitySlug, facilityProfileSelect } from '@/lib/facility';
import { createUniqueDoctorSlug, doctorProfileSelect } from '@/lib/doctor';
import { buildPartnerSchema, isPartnerType, splitValues } from '@/lib/partner-requirements';
import { uniqueViolation } from '@/lib/prisma-errors';
import { startTrial, TRIAL_MONTHS } from '@/lib/subscription';

const bodySchema = z.object({ partnerType: z.string(), values: z.record(z.string(), z.unknown()) });

const nonEmpty = (value: Record<string, unknown>) =>
  Object.keys(value).length > 0 ? (value as Prisma.InputJsonObject) : undefined;

export async function POST(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    if (auth.user.role === 'ADMIN') {
      return jsonError('Admin tidak dapat mendaftar sebagai mitra.', 403);
    }

    const existing = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { doctorProfile: { select: { id: true } }, facility: { select: { id: true } } }
    });

    if (existing?.doctorProfile) {
      return jsonError('Akun ini sudah memiliki profil dokter.', 409);
    }

    if (existing?.facility) {
      return jsonError('Akun ini sudah memiliki profil fasilitas.', 409);
    }

    const parsed = await parseJson(request, bodySchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { partnerType } = parsed.data;

    if (!isPartnerType(partnerType)) {
      return jsonError('Data tidak valid.', 422, { partnerType: ['Jenis mitra tidak dikenal.'] });
    }

    // Field opsional yang dikosongkan di form dikirim sebagai '' dan akan ditolak skema.
    const values = Object.fromEntries(
      Object.entries(parsed.data.values).filter(
        ([, value]) => !(typeof value === 'string' && value.trim() === '')
      )
    );
    const validated = buildPartnerSchema(partnerType).safeParse(values);

    if (!validated.success) {
      return jsonError('Data tidak valid.', 422, validated.error.flatten().fieldErrors);
    }

    const { columns, details, internalDetails } = splitValues(partnerType, validated.data);
    const extra = { details: nonEmpty(details), internalDetails: nonEmpty(internalDetails) };
    const isDoctor = partnerType === 'DOCTOR';
    const role = isDoctor ? 'DOCTOR' : partnerType === 'PHARMACY' ? 'PHARMACY' : 'FACILITY';
    const slug = isDoctor
      ? await createUniqueDoctorSlug(auth.user.name || 'dokter')
      : await createUniqueFacilitySlug(String(columns.name));
    const now = new Date();

    const profile = await prisma.$transaction(async (tx) => {
      const created = isDoctor
        ? await tx.doctorProfile.create({
            data: {
              ...(columns as { specialty: string }),
              ...extra,
              slug,
              userId: auth.user.id,
              verificationStatus: 'VERIFIED'
            },
            select: doctorProfileSelect
          })
        : await tx.facility.create({
            data: {
              ...(columns as { name: string }),
              ...extra,
              type: partnerType,
              slug,
              userId: auth.user.id,
              verificationStatus: 'VERIFIED'
            },
            select: facilityProfileSelect
          });

      await tx.user.update({ where: { id: auth.user.id }, data: { role } });
      const endsAt = await startTrial(tx, auth.user.id, now);

      await tx.notification.create({
        data: {
          userId: auth.user.id,
          type: 'ACCOUNT',
          title: 'Pendaftaran berhasil',
          body: `Profil Anda sudah tayang. Masa gratis ${TRIAL_MONTHS} bulan berlaku sampai ${endsAt.toLocaleDateString('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' })}.`,
          data: isDoctor ? { doctorProfileId: created.id } : { facilityId: created.id }
        }
      });

      return created;
    });

    await recordActivity({
      actorId: auth.user.id,
      action: auditActions.partnerRegister,
      targetType: isDoctor ? 'DOCTOR' : 'FACILITY',
      targetId: profile.id,
      metadata: { partnerType },
      request
    });

    return jsonCreated(profile);
  } catch (error) {
    const unique = uniqueViolation(error);

    if (unique) {
      if (unique.target.includes('slug')) {
        return jsonError('Nama sudah dipakai mitra lain, coba ubah sedikit.', 409);
      }

      return jsonError('Akun ini sudah terdaftar sebagai mitra.', 409);
    }

    return handleRouteError(error);
  }
}
