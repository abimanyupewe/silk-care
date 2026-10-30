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
import {
  getFeaturedDoctors,
  getFeaturedFacilities,
  getFeaturedProducts,
  getLatestArticles,
  getLatestReviews,
  getReviewSummary
} from '@/lib/home/queries';

// Data beranda disegarkan tiap 5 menit; tidak setiap kunjungan menjadi kueri database.
export const revalidate = 300;

export default async function Home() {
  // Kueri berjalan paralel; tiap kueri menangani kegagalannya sendiri (bagian itu disembunyikan).
  const [doctors, facilities, products, articles, reviews, reviewSummary] = await Promise.all([
    getFeaturedDoctors(),
    getFeaturedFacilities(),
    getFeaturedProducts(),
    getLatestArticles(),
    getLatestReviews(),
    getReviewSummary()
  ]);

  return (
    <div>
      <Navbar />
      <Hero />
      <Consultation />
      <DoctorRecommendations doctors={doctors} />
      <Promo />
      <RecomendationClinic facilities={facilities} />
      <MarketplaceSections products={products} />
      <Review reviews={reviews} summary={reviewSummary} />
      <Article articles={articles} />
      <Footer />
    </div>
  );
}
