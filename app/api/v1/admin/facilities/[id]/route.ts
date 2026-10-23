import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { adminFacilitySelect } from '@/lib/admin';

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
    const facility = await prisma.facility.findUnique({
      where: {
        id
      },
      select: adminFacilitySelect
    });

    if (!facility) {
      return jsonError('Fasilitas tidak ditemukan.', 404);
    }

    return jsonOk(facility);
  } catch (error) {
    return handleRouteError(error);
  }
}
