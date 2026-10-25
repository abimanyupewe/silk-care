import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { doctorDetailSelect, publicDoctorWhere } from '@/lib/catalog';
import { formatRating } from '@/lib/rating';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        ...publicDoctorWhere,
        slug
      },
      select: doctorDetailSelect
    });

    if (!doctor) {
      return jsonError('Dokter tidak ditemukan.', 404);
    }

    const { ratingAverage, ...data } = doctor;

    return jsonOk({
      ...data,
      rating: formatRating(ratingAverage)
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
