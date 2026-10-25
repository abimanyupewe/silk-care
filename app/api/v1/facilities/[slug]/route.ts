import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { facilityDetailSelect, publicFacilityWhere } from '@/lib/catalog';
import { formatRating } from '@/lib/rating';

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

    const { ratingAverage, ...data } = facility;

    return jsonOk({
      ...data,
      rating: formatRating(ratingAverage)
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
