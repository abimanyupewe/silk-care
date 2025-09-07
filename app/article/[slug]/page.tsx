import { Detail } from '@/components/features/article/Detail';
import { Other } from '@/components/features/article/Other';
import { Review } from '@/components/features/article/Review';
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
      <Detail />
      <Review />
      <Other />
      <Footer />
    </div>
  );
}
