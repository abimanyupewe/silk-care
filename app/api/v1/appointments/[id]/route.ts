import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { appointmentDetailSelect } from '@/lib/appointment';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: auth.user.id },
      select: appointmentDetailSelect
    });

    if (!appointment) {
      return jsonError('Janji temu tidak ditemukan.', 404);
    }

    return jsonOk(appointment);
  } catch (error) {
    return handleRouteError(error);
  }
}
