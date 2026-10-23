import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireDoctorProfile } from '@/lib/doctor-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { doctorProfileSelect } from '@/lib/doctor';

const updateSchema = z
  .object({
    specialty: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    experienceYears: z.number().int().min(0).max(80).nullable().optional(),
    consultationFee: z.number().int().min(0).max(100_000_000).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi.'
  });

export async function GET() {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: {
        id: auth.doctor.id
      },
      select: doctorProfileSelect
    });

    if (!doctor) {
      return jsonError('Profil dokter tidak ditemukan.', 404);
    }

    return jsonOk(doctor);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const doctor = await prisma.doctorProfile.update({
      where: {
        id: auth.doctor.id
      },
      data: parsed.data,
      select: doctorProfileSelect
    });

    return jsonOk(doctor);
  } catch (error) {
    return handleRouteError(error);
  }
}
