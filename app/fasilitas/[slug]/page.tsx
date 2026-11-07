import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPartnerDetail } from '@/components/shared/PublicPartnerDetail';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { prisma } from '@/lib/db';
import { facilityDetailSelect, publicFacilityWhereAt } from '@/lib/catalog';
import { facilityTypeLabels } from '@/lib/facility-types';
import { formatRating } from '@/lib/rating';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const facility = await prisma.facility.findFirst({
    where: { ...publicFacilityWhereAt(new Date()), slug },
    select: { name: true }
  });
  return { title: facility ? `${facility.name} — SILK` : 'Fasilitas kesehatan — SILK' };
}

export default async function FacilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const facility = await prisma.facility.findFirst({
    where: { ...publicFacilityWhereAt(new Date()), slug },
    select: facilityDetailSelect
  });
  if (!facility) notFound();

  return (
    <>
      <Navbar />
      <PublicPartnerDetail
        name={facility.name}
        label={facilityTypeLabels[facility.type]}
        description={facility.description}
        address={facility.address}
        city={facility.city}
        phone={facility.phone}
        photoUrl={facility.photoUrl ?? facility.user.image}
        videoUrl={facility.videoUrl}
        reels={facility.reels}
        reviews={facility.reviews}
        rating={formatRating(facility.ratingAverage)}
        reviewCount={facility.reviewCount}
        schedule={facility.operatingHours.map((item) => ({
          day: item.dayOfWeek,
          start: item.openTime ?? '',
          end: item.closeTime ?? '',
          closed: item.isClosed
        }))}
        services={facility.services}
      />
      <Footer />
    </>
  );
}
