import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { medicalRecordDetailSelect } from '@/lib/consultation';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['PATIENT']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id,
        patientId: auth.user.id
      },
      select: medicalRecordDetailSelect
    });

    if (!record) {
      return jsonError('Rekam medis tidak ditemukan.', 404);
    }

    return jsonOk(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
