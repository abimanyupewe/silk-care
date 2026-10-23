import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { consultationDetailSelect } from '@/lib/consultation';

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
    const consultation = await prisma.consultation.findFirst({
      where: {
        id,
        patientId: auth.user.id
      },
      select: consultationDetailSelect
    });

    if (!consultation) {
      return jsonError('Konsultasi tidak ditemukan.', 404);
    }

    return jsonOk(consultation);
  } catch (error) {
    return handleRouteError(error);
  }
}
