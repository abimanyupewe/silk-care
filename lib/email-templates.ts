// Katalog template email + renderer. Murni (tanpa import server) agar dipakai juga oleh
// pratinjau di panel admin. Override tersimpan di tabel EmailTemplate; tanpa override,
// teks default di bawah dipakai.

export const emailAudiences = ['PATIENT', 'DOCTOR', 'FACILITY'] as const;
export type EmailAudience = (typeof emailAudiences)[number];

export const emailAudienceLabels: Record<EmailAudience, string> = {
  PATIENT: 'Pengguna',
  DOCTOR: 'Dokter',
  FACILITY: 'Fasilitas'
};

export type EmailTemplateVariable = {
  name: string;
  label: string;
  sample: string;
};

export type EmailTemplateDef = {
  key: string;
  label: string;
  description: string;
  group: string;
  variables: EmailTemplateVariable[];
  // Placeholder yang wajib ada di isi email (mis. tautan verifikasi).
  required: string[];
  subject: string;
  body: string;
};

const nama: EmailTemplateVariable = {
  name: 'nama',
  label: 'Nama penerima',
  sample: 'Budi Santoso'
};
const kodePesanan: EmailTemplateVariable = {
  name: 'kode_pesanan',
  label: 'Kode pesanan',
  sample: '#A1B2C3D4'
};
const link = (label: string, sample: string): EmailTemplateVariable => ({
  name: 'link',
  label,
  sample
});
const catatan = (label: string, sample: string): EmailTemplateVariable => ({
  name: 'catatan',
  label,
  sample
});

const thanks = 'Terima kasih telah menggunakan SILK.';

const payment = (message: string) => `Halo {{nama}},

${message} ({{kode_pesanan}})

{{link}}

${thanks}`;

export const emailTemplateDefs: EmailTemplateDef[] = [
  {
    key: 'EMAIL_VERIFICATION',
    label: 'Verifikasi email',
    description: 'Dikirim setelah mendaftar atau saat meminta kirim ulang verifikasi.',
    group: 'Akun',
    variables: [
      nama,
      link('Tautan verifikasi', 'https://silk.example/verify-email?token=abc123'),
      { name: 'token', label: 'Token verifikasi', sample: 'abc123' }
    ],
    required: ['link'],
    subject: 'Verifikasi email SILK',
    body: `Halo {{nama}},

Terima kasih telah mendaftar di SILK. Verifikasi alamat email Anda dengan membuka tautan berikut:
{{link}}

Token verifikasi: {{token}}

Tautan dan token berlaku selama 24 jam.
Jika Anda tidak merasa membuat akun SILK, abaikan email ini.`
  },
  {
    key: 'PASSWORD_RESET',
    label: 'Reset password',
    description: 'Dikirim saat pengguna meminta atur ulang password.',
    group: 'Akun',
    variables: [
      nama,
      link('Tautan reset', 'https://silk.example/reset-password?token=abc123'),
      { name: 'token', label: 'Token reset', sample: 'abc123' }
    ],
    required: ['link'],
    subject: 'Reset password SILK',
    body: `Halo {{nama}},

Kami menerima permintaan untuk mengatur ulang password akun SILK Anda. Buka tautan berikut:
{{link}}

Token reset password: {{token}}

Tautan dan token berlaku selama 1 jam.
Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak berubah.`
  },
  {
    key: 'PARTNER_VERIFICATION',
    label: 'Status verifikasi mitra',
    description: 'Dikirim ke dokter/fasilitas saat verifikasi diproses admin.',
    group: 'Mitra',
    variables: [
      nama,
      { name: 'jenis_mitra', label: 'Jenis mitra', sample: 'dokter' },
      { name: 'status', label: 'Status verifikasi', sample: 'telah diverifikasi' },
      catatan('Catatan admin (opsional)', 'Dokumen sudah lengkap.'),
      link('Tautan dashboard mitra', 'https://silk.example/dashboard/dokter')
    ],
    required: [],
    subject: 'Verifikasi {{jenis_mitra}} {{status}}',
    body: `Halo {{nama}},

Status verifikasi {{jenis_mitra}} Anda {{status}}.
Catatan: {{catatan}}

{{link}}

Terima kasih telah bergabung dengan SILK.`
  },
  {
    key: 'ORDER_CREATED',
    label: 'Pesanan dibuat',
    description: 'Dikirim ke pembeli setelah checkout.',
    group: 'Pesanan',
    variables: [
      nama,
      kodePesanan,
      { name: 'fasilitas', label: 'Nama apotek/fasilitas', sample: 'Apotek SILK' },
      { name: 'total', label: 'Total pembayaran', sample: 'Rp125.000' },
      link('Tautan pesanan', 'https://silk.example/orders/abc')
    ],
    required: [],
    subject: 'Pesanan {{kode_pesanan}} dibuat',
    body: `Halo {{nama}},

Pesanan {{kode_pesanan}} dari {{fasilitas}} berhasil dibuat.
Total: {{total}}

Selesaikan pembayaran sebelum batas waktu agar pesanan tidak dibatalkan otomatis.
{{link}}

${thanks}`
  },
  {
    key: 'ORDER_STATUS',
    label: 'Status pesanan berubah',
    description: 'Dikirim saat status pesanan diperbarui atau dibatalkan.',
    group: 'Pesanan',
    variables: [
      nama,
      kodePesanan,
      { name: 'status', label: 'Status pesanan', sample: 'Sedang diproses' },
      catatan('Catatan (opsional)', 'Pesanan sedang disiapkan.'),
      link('Tautan pesanan', 'https://silk.example/orders/abc')
    ],
    required: [],
    subject: 'Status pesanan {{kode_pesanan}}: {{status}}',
    body: `Halo {{nama}},

Status pesanan {{kode_pesanan}} sekarang: {{status}}.
Catatan: {{catatan}}

{{link}}

${thanks}`
  },
  {
    key: 'PAYMENT_PAID',
    label: 'Pembayaran diterima',
    description: 'Dikirim saat pembayaran berhasil.',
    group: 'Pembayaran',
    variables: [nama, kodePesanan, link('Tautan pesanan', 'https://silk.example/orders/abc')],
    required: [],
    subject: 'Pembayaran {{kode_pesanan}} diterima',
    body: payment('Pembayaran Anda telah kami terima. Pesanan akan segera diproses.')
  },
  {
    key: 'PAYMENT_LATE_PAID',
    label: 'Pembayaran diterima setelah pembatalan',
    description: 'Dikirim saat pembayaran masuk setelah pesanan dibatalkan (perlu refund).',
    group: 'Pembayaran',
    variables: [nama, kodePesanan, link('Tautan pesanan', 'https://silk.example/orders/abc')],
    required: [],
    subject: 'Pembayaran {{kode_pesanan}} diterima setelah pembatalan',
    body: payment(
      'Pembayaran Anda diterima setelah pesanan dibatalkan. Tim SILK akan menghubungi Anda untuk proses pengembalian dana.'
    )
  },
  {
    key: 'PAYMENT_FAILED',
    label: 'Pembayaran gagal',
    description: 'Dikirim saat pembayaran tidak berhasil.',
    group: 'Pembayaran',
    variables: [nama, kodePesanan, link('Tautan pesanan', 'https://silk.example/orders/abc')],
    required: [],
    subject: 'Pembayaran {{kode_pesanan}} gagal',
    body: payment('Pembayaran tidak berhasil. Anda dapat mencoba pembayaran kembali.')
  },
  {
    key: 'PAYMENT_EXPIRED',
    label: 'Pembayaran kedaluwarsa',
    description: 'Dikirim saat batas waktu pembayaran habis.',
    group: 'Pembayaran',
    variables: [nama, kodePesanan, link('Tautan pesanan', 'https://silk.example/orders/abc')],
    required: [],
    subject: 'Pembayaran {{kode_pesanan}} kedaluwarsa',
    body: payment('Batas waktu pembayaran telah habis dan pesanan dibatalkan.')
  },
  {
    key: 'PAYMENT_REFUNDED',
    label: 'Pembayaran direfund',
    description: 'Dikirim saat pembayaran dikembalikan.',
    group: 'Pembayaran',
    variables: [nama, kodePesanan, link('Tautan pesanan', 'https://silk.example/orders/abc')],
    required: [],
    subject: 'Pembayaran {{kode_pesanan}} direfund',
    body: payment('Pembayaran pesanan Anda telah direfund.')
  },
  {
    key: 'CONSULTATION_REQUEST',
    label: 'Permintaan konsultasi baru',
    description: 'Dikirim ke dokter saat pasien mengajukan konsultasi.',
    group: 'Konsultasi',
    variables: [
      nama,
      { name: 'nama_pasien', label: 'Nama pasien', sample: 'Budi Santoso' },
      { name: 'jadwal', label: 'Jadwal konsultasi', sample: 'Senin, 3 November 2026 pukul 10.00' },
      { name: 'keluhan', label: 'Keluhan pasien', sample: 'Demam tiga hari.' },
      link('Tautan konsultasi dokter', 'https://silk.example/dashboard/dokter/konsultasi')
    ],
    required: [],
    subject: 'Permintaan konsultasi baru dari {{nama_pasien}}',
    body: `Halo {{nama}},

{{nama_pasien}} mengajukan konsultasi pada {{jadwal}}.
Keluhan: {{keluhan}}

{{link}}

Silakan konfirmasi atau batalkan jadwal melalui dashboard dokter.`
  },
  {
    key: 'CONSULTATION_CANCELLED',
    label: 'Konsultasi dibatalkan pasien',
    description: 'Dikirim ke dokter saat pasien membatalkan konsultasi.',
    group: 'Konsultasi',
    variables: [
      nama,
      { name: 'nama_pasien', label: 'Nama pasien', sample: 'Budi Santoso' },
      { name: 'jadwal', label: 'Jadwal konsultasi', sample: 'Senin, 3 November 2026 pukul 10.00' },
      { name: 'alasan', label: 'Alasan (opsional)', sample: 'Berhalangan hadir.' },
      link('Tautan konsultasi dokter', 'https://silk.example/dashboard/dokter/konsultasi')
    ],
    required: [],
    subject: 'Konsultasi dibatalkan oleh {{nama_pasien}}',
    body: `Halo {{nama}},

{{nama_pasien}} membatalkan konsultasi pada {{jadwal}}.
Alasan: {{alasan}}

{{link}}

${thanks}`
  },
  {
    key: 'CONSULTATION_STATUS',
    label: 'Status konsultasi berubah',
    description: 'Dikirim ke pasien saat dokter mengonfirmasi, menyelesaikan, atau membatalkan.',
    group: 'Konsultasi',
    variables: [
      nama,
      { name: 'nama_dokter', label: 'Nama dokter', sample: 'dr. Clara' },
      { name: 'jadwal', label: 'Jadwal konsultasi', sample: 'Senin, 3 November 2026 pukul 10.00' },
      { name: 'status', label: 'Status konsultasi', sample: 'Dikonfirmasi' },
      catatan('Catatan (opsional)', 'Mohon hadir 10 menit lebih awal.'),
      link('Tautan konsultasi', 'https://silk.example/consultations')
    ],
    required: [],
    subject: 'Konsultasi dengan {{nama_dokter}}: {{status}}',
    body: `Halo {{nama}},

Status konsultasi Anda dengan {{nama_dokter}} pada {{jadwal}} sekarang: {{status}}.
Catatan: {{catatan}}

{{link}}

${thanks}`
  },
  {
    key: 'MEDICAL_RECORD',
    label: 'Rekam medis tersedia',
    description: 'Dikirim ke pasien saat dokter mengisi rekam medis.',
    group: 'Konsultasi',
    variables: [
      nama,
      { name: 'nama_dokter', label: 'Nama dokter', sample: 'dr. Clara' },
      link('Tautan rekam medis', 'https://silk.example/medical-records')
    ],
    required: [],
    subject: 'Rekam medis konsultasi Anda tersedia',
    body: `Halo {{nama}},

Dokter {{nama_dokter}} telah mengisi rekam medis konsultasi Anda.
Buka halaman riwayat konsultasi untuk melihat diagnosis, catatan, dan resep.

{{link}}

${thanks}`
  },
  {
    key: 'ARTICLE_APPROVED',
    label: 'Artikel disetujui',
    description: 'Dikirim ke penulis saat artikel diterbitkan.',
    group: 'Konten',
    variables: [
      nama,
      { name: 'judul_artikel', label: 'Judul artikel', sample: 'Tips Menjaga Imunitas' },
      catatan('Catatan moderator (opsional)', 'Artikel bagus.'),
      link('Tautan artikel', 'https://silk.example/article/tips-imunitas')
    ],
    required: [],
    subject: 'Artikel Anda disetujui',
    body: `Halo {{nama}},

Artikel "{{judul_artikel}}" telah diterbitkan.
Catatan moderator: {{catatan}}

{{link}}

Terima kasih telah berkontribusi di SILK.`
  },
  {
    key: 'ARTICLE_REJECTED',
    label: 'Artikel perlu diperbaiki',
    description: 'Dikirim ke penulis saat artikel ditolak.',
    group: 'Konten',
    variables: [
      nama,
      { name: 'judul_artikel', label: 'Judul artikel', sample: 'Tips Menjaga Imunitas' },
      catatan('Catatan moderator (opsional)', 'Tambahkan sumber rujukan.'),
      link('Tautan artikel', 'https://silk.example/article/tips-imunitas')
    ],
    required: [],
    subject: 'Artikel Anda perlu diperbaiki',
    body: `Halo {{nama}},

Artikel "{{judul_artikel}}" belum disetujui.
Catatan moderator: {{catatan}}

{{link}}

Terima kasih telah berkontribusi di SILK.`
  },
  {
    key: 'REVIEW_APPROVED',
    label: 'Ulasan ditayangkan',
    description: 'Dikirim ke penulis ulasan saat ulasan disetujui.',
    group: 'Ulasan',
    variables: [
      nama,
      { name: 'rating', label: 'Rating (1–5)', sample: '5' },
      catatan('Catatan moderator (opsional)', 'Terima kasih.')
    ],
    required: [],
    subject: 'Ulasan Anda telah ditayangkan',
    body: `Halo {{nama}},

Ulasan Anda dengan rating {{rating}}/5 telah ditayangkan.
Catatan moderator: {{catatan}}

Terima kasih telah membantu pengguna lain memilih layanan di SILK.`
  },
  {
    key: 'REVIEW_REJECTED',
    label: 'Ulasan belum disetujui',
    description: 'Dikirim ke penulis ulasan saat ulasan ditolak.',
    group: 'Ulasan',
    variables: [
      nama,
      { name: 'rating', label: 'Rating (1–5)', sample: '1' },
      catatan('Catatan moderator (opsional)', 'Mengandung kata kasar.')
    ],
    required: [],
    subject: 'Ulasan Anda belum disetujui',
    body: `Halo {{nama}},

Ulasan Anda dengan rating {{rating}}/5 belum disetujui.
Catatan moderator: {{catatan}}

Terima kasih telah membantu pengguna lain memilih layanan di SILK.`
  },
  {
    key: 'REVIEW_RECEIVED',
    label: 'Ulasan baru diterima',
    description: 'Dikirim ke dokter/fasilitas saat ada ulasan baru.',
    group: 'Ulasan',
    variables: [nama, { name: 'rating', label: 'Rating (1–5)', sample: '4' }],
    required: [],
    subject: 'Ulasan baru untuk layanan Anda',
    body: `Halo {{nama}},

Ada ulasan baru dengan rating {{rating}}/5 untuk layanan Anda.
Ulasan akan ditayangkan setelah melewati moderasi.

${thanks}`
  }
];

const defsByKey = new Map(emailTemplateDefs.map((def) => [def.key, def]));

export function getEmailTemplateDef(key: string) {
  return defsByKey.get(key);
}

export function isEmailAudience(value: string): value is EmailAudience {
  return (emailAudiences as readonly string[]).includes(value);
}

const placeholderPattern = /\{\{(\w+)\}\}/g;

export function renderEmailSubject(subject: string, vars: Record<string, string>) {
  return subject
    .replace(placeholderPattern, (_, name: string) => vars[name] ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Baris yang semua placeholder-nya kosong (mis. "Catatan: {{catatan}}") dibuang utuh,
// lalu baris kosong beruntun dirapatkan.
export function renderEmailText(text: string, vars: Record<string, string>) {
  const lines = text.split('\n').filter((line) => {
    const names = [...line.matchAll(placeholderPattern)].map((match) => match[1]);

    return names.length === 0 || names.some((name) => (vars[name] ?? '').trim() !== '');
  });

  return lines
    .map((line) => line.replace(placeholderPattern, (_, name: string) => vars[name] ?? ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sampleVars(def: EmailTemplateDef) {
  return Object.fromEntries(def.variables.map((variable) => [variable.name, variable.sample]));
}

// Mengembalikan pesan error, atau null jika template boleh disimpan.
export function validateEmailTemplate(def: EmailTemplateDef, subject: string, body: string) {
  const allowed = new Set(def.variables.map((variable) => variable.name));

  if (!subject.trim()) return 'Subjek tidak boleh kosong.';
  if (!body.trim()) return 'Isi email tidak boleh kosong.';

  const used = new Set(
    [...`${subject}\n${body}`.matchAll(placeholderPattern)].map((match) => match[1])
  );
  const unknown = [...used].filter((name) => !allowed.has(name));

  if (unknown.length > 0) {
    return `Placeholder tidak dikenal: ${unknown.map((name) => `{{${name}}}`).join(', ')}.`;
  }

  const bodyUsed = new Set([...body.matchAll(placeholderPattern)].map((match) => match[1]));
  const missing = def.required.filter((name) => !bodyUsed.has(name));

  if (missing.length > 0) {
    return `Isi email wajib memuat ${missing.map((name) => `{{${name}}}`).join(', ')}.`;
  }

  return null;
}
