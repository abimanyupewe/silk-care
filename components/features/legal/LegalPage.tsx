import { TriangleAlert } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';

export type LegalSection = { heading: string; paragraphs: string[] };

// Kerangka halaman hukum. Isi masih draf: pemberitahuan di atas halaman memastikan tidak ada
// pengunjung yang mengira ini ketentuan yang berlaku.
export const LegalPage = ({
  title,
  intro,
  sections
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) => (
  <div>
    <Navbar />
    <main className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-ink-muted">{intro}</p>

      <div
        role="note"
        className="mt-6 flex items-start gap-3 rounded-md border border-amber bg-amber-tint p-4 text-sm text-amber-ink"
      >
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>Draf.</strong> Isi halaman ini belum final dan belum ditinjau pihak hukum. Jangan
          dianggap sebagai ketentuan yang berlaku.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-ink">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-ink-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);
