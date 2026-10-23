import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireDoctorProfile } from '@/lib/doctor-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { medicalRecordSelect } from '@/lib/consultation';

const recordSchema = z.object({
  diagnosis: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(5000).nullable().optional(),
  prescription: z.string().trim().max(5000).nullable().optional(),
  followUpAt: z.coerce.date().nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const consultation = await prisma.consultation.findFirst({
      where: {
        id,
        doctorProfileId: auth.doctor.id
      },
      select: {
        id: true,
        status: true,
        patientId: true
      }
    });

    if (!consultation) {
      return jsonError('Konsultasi tidak ditemukan.', 404);
    }

    if (consultation.status !== 'COMPLETED') {
      return jsonError('Rekam medis hanya dapat diisi setelah konsultasi selesai.', 409);
    }

    const parsed = await parseJson(request, recordSchema);

    if (parsed.error) {
      return parsed.error;
    }

    if (parsed.data.followUpAt && Number.isNaN(parsed.data.followUpAt.getTime())) {
      return jsonError('Tanggal kontrol tidak valid.', 422);
    }

    const existing = await prisma.medicalRecord.findUnique({
      where: {
        consultationId: consultation.id
      },
      select: {
        id: true
      }
    });

    const record = await prisma.$transaction(async (tx) => {
      const saved = await tx.medicalRecord.upsert({
        where: {
          consultationId: consultation.id
        },
        update: {
          diagnosis: parsed.data.diagnosis,
          notes: parsed.data.notes,
          prescription: parsed.data.prescription,
          followUpAt: parsed.data.followUpAt
        },
        create: {
          consultationId: consultation.id,
          patientId: consultation.patientId,
          doctorProfileId: auth.doctor.id,
          diagnosis: parsed.data.diagnosis,
          notes: parsed.data.notes,
          prescription: parsed.data.prescription,
          followUpAt: parsed.data.followUpAt
        },
        select: medicalRecordSelect
      });

      if (!existing) {
        await tx.notification.create({
          data: {
            userId: consultation.patientId,
            type: 'CONSULTATION',
            title: 'Rekam medis tersedia',
            body: 'Dokter telah mengisi rekam medis konsultasi Anda.',
            data: {
              consultationId: consultation.id,
              medicalRecordId: saved.id
            }
          }
        });
      }

      return saved;
    });

    return jsonOk(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
