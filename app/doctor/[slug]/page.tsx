import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPartnerDetail } from '@/components/shared/PublicPartnerDetail';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { prisma } from '@/lib/db';
import { doctorDetailSelect, publicDoctorWhereAt } from '@/lib/catalog';
import { formatRating } from '@/lib/rating';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await prisma.doctorProfile.findFirst({
    where: { ...publicDoctorWhereAt(new Date()), slug },
    select: { user: { select: { name: true } } }
  });
  return { title: doctor ? `${doctor.user.name} — SILK` : 'Dokter — SILK' };
}

export default async function DoctorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor = await prisma.doctorProfile.findFirst({
    where: { ...publicDoctorWhereAt(new Date()), slug },
    select: doctorDetailSelect
  });
  if (!doctor) notFound();

  return (
    <>
      <Navbar />
      <PublicPartnerDetail
        name={doctor.user.name}
        label="Dokter"
        specialty={doctor.specialty}
        description={doctor.bio}
        address={doctor.address}
        city={doctor.city}
        photoUrl={doctor.photoUrl ?? doctor.user.image}
        videoUrl={doctor.videoUrl}
        reels={doctor.reels}
        reviews={doctor.reviews}
        rating={formatRating(doctor.ratingAverage)}
        reviewCount={doctor.reviewCount}
        fee={doctor.consultationFee}
        schedule={doctor.schedules.map((item) => ({
          day: item.dayOfWeek,
          start: item.startTime,
          end: item.endTime
        }))}
      />
      <Footer />
    </>
  );
}
