import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { publicFacilityServiceWhere, publicFacilityWhereAt } from '@/lib/catalog';
import { publicFacilityServiceSelect } from '@/lib/facility-service';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const facility = await prisma.facility.findFirst({
      where: { ...publicFacilityWhereAt(new Date()), slug },
      select: { id: true }
    });

    if (!facility) {
      return jsonError('Fasilitas tidak ditemukan.', 404);
    }

    const services = await prisma.facilityService.findMany({
      where: { ...publicFacilityServiceWhere, facilityId: facility.id },
      orderBy: { name: 'asc' },
      select: publicFacilityServiceSelect
    });

    return jsonOk(services);
  } catch (error) {
    return handleRouteError(error);
  }
}
