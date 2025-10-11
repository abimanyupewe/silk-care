import { Ecommerce } from "@/components/features/apotek/Ecommerce";
import { Footer } from "@/components/shared/Footer";
import { Navbar } from "@/components/shared/Navbar";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Ecommerce />
      <Footer />
    </div>
  );
}
