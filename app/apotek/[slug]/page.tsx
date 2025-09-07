import { Detail } from '@/components/features/apotek/Detail';
import { Hero } from '@/components/features/apotek/Hero';
import { Other } from '@/components/features/apotek/Other';
import { Review } from '@/components/features/apotek/Review';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';

export interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default function Home({ params }: PageProps) {
  console.log(params);

  return (
    <div>
      <Navbar />
      <Hero />
      <Detail />
      <Review />
      <Other />
      <Footer />
    </div>
  );
}
