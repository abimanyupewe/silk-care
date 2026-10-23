import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { doctorDetailSelect, getDoctorRatings, publicDoctorWhere } from '@/lib/catalog';

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

    const ratings = await getDoctorRatings([doctor.id]);
    const summary = ratings.get(doctor.id) ?? { rating: null, reviewCount: 0 };

    return jsonOk({
      ...doctor,
      ...summary
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
