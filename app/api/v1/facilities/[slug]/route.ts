import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { facilityDetailSelect, getFacilityRatings, publicFacilityWhere } from '@/lib/catalog';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const facility = await prisma.facility.findFirst({
      where: {
        ...publicFacilityWhere,
        slug
      },
      select: facilityDetailSelect
    });

    if (!facility) {
      return jsonError('Fasilitas tidak ditemukan.', 404);
    }

    const ratings = await getFacilityRatings([facility.id]);
    const summary = ratings.get(facility.id) ?? { rating: null, reviewCount: 0 };

    return jsonOk({
      ...facility,
      ...summary
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
