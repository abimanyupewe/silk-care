import { Article } from '@/components/features/doctor/Article';
import { Detail } from '@/components/features/doctor/Detail';
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
      <Article />
      <Footer />
    </div>
  );
}
