import { redirect } from 'next/navigation';

export default async function PharmacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/fasilitas/${slug}`);
}
