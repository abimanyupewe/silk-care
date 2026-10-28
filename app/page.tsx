import { Navbar } from '@/components/shared/Navbar';
import { Campaign } from '@/components/features/Homepage/Campaign';
import { Promo } from '@/components/features/Homepage/Promo';
import { Consultation } from '@/components/features/Homepage/Consultation';
import { Service } from '@/components/features/Homepage/Service';
import { RecomendationClinic } from '@/components/features/Homepage/RecomendationClinic';
import { Review } from '@/components/features/Homepage/Review';
import { Article } from '@/components/features/Homepage/Article';
import { Footer } from '@/components/shared/Footer';

export default function Home() {
  return (
    <div>
      <Navbar />
      <Campaign />
      <Consultation />
      <Service />
      <Promo />
      <RecomendationClinic />
      <Review />
      <Article />
      <Footer />
    </div>
  );
}
