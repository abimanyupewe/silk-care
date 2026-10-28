import { Navbar } from '@/components/shared/Navbar';
import { Hero } from '@/components/features/Homepage/Hero';
import { Promo } from '@/components/features/Homepage/Promo';
import { Consultation } from '@/components/features/Homepage/Consultation';
import { DoctorRecommendations } from '@/components/features/Homepage/DoctorRecommendations';
import { RecomendationClinic } from '@/components/features/Homepage/RecomendationClinic';
import { MarketplaceSections } from '@/components/features/Homepage/MarketplaceSection';
import { Review } from '@/components/features/Homepage/Review';
import { Article } from '@/components/features/Homepage/Article';
import { Footer } from '@/components/shared/Footer';

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Consultation />
      <DoctorRecommendations />
      <Promo />
      <RecomendationClinic />
      <MarketplaceSections />
      <Review />
      <Article />
      <Footer />
    </div>
  );
}
