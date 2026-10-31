// Template bawaan banner. Bagian dalam [ ] harus diisi admin; banner yang masih memuatnya
// tidak bisa diaktifkan (lihat hasPlaceholder di lib/announcement.ts).
import type { AnnouncementToneValue } from '@/lib/announcement';

export type AnnouncementTemplate = {
  key: string;
  label: string;
  message: string;
  tone: AnnouncementToneValue;
  linkLabel: string | null;
  linkUrl: string | null;
};

export const announcementTemplates: AnnouncementTemplate[] = [
  {
    key: 'promo',
    label: 'Promo',
    message: 'Promo bulan ini: nikmati harga spesial untuk layanan pilihan di SILK.',
    tone: 'PROMO',
    linkLabel: 'Lihat promo',
    linkUrl: '/fasilitas'
  },
  {
    key: 'maintenance',
    label: 'Pemeliharaan terjadwal',
    message:
      'Pemeliharaan sistem pada [tanggal dan jam]. Beberapa fitur mungkin tidak dapat diakses sementara.',
    tone: 'IMPORTANT',
    linkLabel: null,
    linkUrl: null
  },
  {
    key: 'incident',
    label: 'Gangguan layanan',
    message:
      'Kami sedang mengatasi gangguan pada [nama fitur]. Mohon maaf atas ketidaknyamanannya.',
    tone: 'IMPORTANT',
    linkLabel: null,
    linkUrl: null
  },
  {
    key: 'new-facility',
    label: 'Fasilitas baru bergabung',
    message: 'Fasilitas kesehatan baru telah bergabung di SILK.',
    tone: 'INFO',
    linkLabel: 'Lihat fasilitas',
    linkUrl: '/fasilitas'
  },
  {
    key: 'partner-invite',
    label: 'Ajakan jadi mitra',
    message: 'Punya klinik atau apotek? Daftarkan fasilitas Anda di SILK.',
    tone: 'INFO',
    linkLabel: 'Daftar mitra',
    linkUrl: '/daftar'
  }
];
