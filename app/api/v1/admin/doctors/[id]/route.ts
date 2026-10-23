import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { adminDoctorSelect } from '@/lib/admin';

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
    const doctor = await prisma.doctorProfile.findUnique({
      where: {
        id
      },
      select: adminDoctorSelect
    });

    if (!doctor) {
      return jsonError('Dokter tidak ditemukan.', 404);
    }

    return jsonOk(doctor);
  } catch (error) {
    return handleRouteError(error);
  }
}
