import Link from "next/link";
import { Input } from "../ui/input";

// Sub-komponen untuk setiap kolom link agar kode lebih rapi
const FooterLinkColumn = ({ title, links }: { title: string; links: { href: string; label: string }[] }) => (
  <div>
    <h3 className="font-bold text-white text-lg mb-4">{title}</h3>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} className="text-white/80 hover:text-white transition-colors">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  // Data untuk link di footer
  const silkLinks = [
    { href: "#", label: "Blog kesehatan" },
    { href: "#", label: "Dokter" },
    { href: "#", label: "Promo" },
    { href: "#", label: "Tentang Kami" },
    { href: "#", label: "Layanan" },
  ];

  const collaborationLinks = [
    { href: "#", label: "Daftar ambulance" },
    { href: "#", label: "Daftar Dokter" },
    { href: "#", label: "Daftar Klinik" },
  ];

  return (
    <footer className="bg-[#00A991]">
      <div className="container mx-auto max-w-7xl px-4 py-12 text-sm">
        {/* Konten Utama Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Kolom 1: Newsletter */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-white/90 mb-2">
              Dapatkan update artikel kesehatan, promo, dan fitur terbaru SILK langsung ke email Anda!
            </h3>
            <div className="mt-4 flex items-center bg-white p-1 rounded-lg">
              <Input
                type="email"
                placeholder="Email"
                className="bg-transparent border-none text-gray-800 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
              />
              <button className="bg-[#00A991] text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-opacity-90 transition flex-shrink-0">
                Kirim
              </button>
            </div>
          </div>

          {/* Kolom 2: Silk */}
          <FooterLinkColumn title="Silk" links={silkLinks} />

          {/* Kolom 3: Kolaborasi */}
          <FooterLinkColumn title="Kolaborasi" links={collaborationLinks} />

          {/* Kolom 4: Hubungi Kami */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4">Hubungi Kami</h3>
            <div className="space-y-3 text-white/80">
              <p>Jl. Sehat Selalu No. 10, Jakarta</p>
              <p>info@silkhealth.id</p>
              <p>(021) 1234-5678</p>
            </div>
          </div>
        </div>

        {/* Garis Pemisah & Copyright */}
        <div className="mt-12 border-t border-white/20 pt-6 text-center">
          <p className="text-white/70 text-xs">
            © 2025 SILK Health. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
