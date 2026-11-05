import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/features/legal/LegalPage';

// Draf: jangan diindeks mesin pencari sampai isinya final.
export const metadata: Metadata = {
  title: 'Kebijakan Privasi — SILK',
  robots: { index: false, follow: true }
};

const pending = ['Bagian ini sedang disiapkan.'];

const sections: LegalSection[] = [
  { heading: 'Data yang kami kumpulkan', paragraphs: pending },
  { heading: 'Cara kami menggunakan data', paragraphs: pending },
  { heading: 'Penyimpanan dan keamanan', paragraphs: pending },
  { heading: 'Hak Anda atas data pribadi', paragraphs: pending },
  { heading: 'Menghubungi kami', paragraphs: pending }
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Kebijakan privasi"
      intro="Penjelasan tentang bagaimana SILK mengelola data pribadi Anda."
      sections={sections}
    />
  );
}
