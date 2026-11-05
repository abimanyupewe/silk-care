import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/features/legal/LegalPage';

// Draf: jangan diindeks mesin pencari sampai isinya final.
export const metadata: Metadata = {
  title: 'Syarat dan Ketentuan — SILK',
  robots: { index: false, follow: true }
};

const pending = ['Bagian ini sedang disiapkan.'];

const sections: LegalSection[] = [
  { heading: 'Penggunaan layanan', paragraphs: pending },
  { heading: 'Akun dan keamanan', paragraphs: pending },
  { heading: 'Informasi kesehatan bukan pengganti nasihat medis', paragraphs: pending },
  { heading: 'Transaksi dan pembayaran', paragraphs: pending },
  { heading: 'Batasan tanggung jawab', paragraphs: pending },
  { heading: 'Perubahan ketentuan', paragraphs: pending }
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat dan ketentuan"
      intro="Ketentuan penggunaan layanan SILK."
      sections={sections}
    />
  );
}
