// import { Campaign } from "@/components/features/doctor/Campaign";
import { Recomendation } from "@/components/features/doctor/Recomendation";
import { Reference } from "@/components/features/doctor/Reference";
import { Footer } from "@/components/shared/Footer";
import { Navbar } from "@/components/shared/Navbar";

export default function Home() {
  return (
    <div>
      <Navbar />
      {/* <Campaign /> */}
      <Recomendation />
      <Reference />
      <Footer />
    </div>
  );
}
