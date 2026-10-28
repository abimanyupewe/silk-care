import { getAppUrl } from '@/lib/app-url';
import { sendEmail } from '@/lib/email';
import { logError } from '@/lib/logger';

type EmailRecipient = {
  name: string;
  to: string;
};

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

const orderStatusLabels: Record<string, string> = {
  PENDING: 'Menunggu pembayaran',
  PAID: 'Sudah dibayar',
  PROCESSING: 'Sedang diproses',
  SHIPPED: 'Sudah dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

const consultationStatusLabels: Record<string, string> = {
  REQUESTED: 'Menunggu konfirmasi dokter',
  CONFIRMED: 'Dikonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(date);
}

function orderCode(orderId: string) {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

async function sendSafe(input: { to: string; subject: string; text: string }) {
  try {
    await sendEmail(input);
  } catch (error) {
    logError('email.transaction_failed', error);
  }
}

export async function sendOrderCreatedEmail({
  to,
  name,
  orderId,
  total,
  facilityName
}: EmailRecipient & {
  orderId: string;
  total: number;
  facilityName: string;
}) {
  await sendSafe({
    to,
    subject: `Pesanan ${orderCode(orderId)} dibuat`,
    text: [
      `Halo ${name},`,
      '',
      `Pesanan ${orderCode(orderId)} dari ${facilityName} berhasil dibuat.`,
      `Total: ${rupiah.format(total)}`,
      '',
      'Selesaikan pembayaran sebelum batas waktu agar pesanan tidak dibatalkan otomatis.',
      `${getAppUrl()}/orders/${orderId}`,
      '',
      'Terima kasih telah menggunakan SILK.'
    ].join('\n')
  });
}

export async function sendOrderStatusEmail({
  to,
  name,
  orderId,
  status,
  note
}: EmailRecipient & {
  orderId: string;
  status: string;
  note?: string | null;
}) {
  await sendSafe({
    to,
    subject: `Status pesanan ${orderCode(orderId)}: ${orderStatusLabels[status] ?? status}`,
    text: [
      `Halo ${name},`,
      '',
      `Status pesanan ${orderCode(orderId)} sekarang: ${orderStatusLabels[status] ?? status}.`,
      note ? `Catatan: ${note}` : '',
      '',
      `${getAppUrl()}/orders/${orderId}`,
      '',
      'Terima kasih telah menggunakan SILK.'
    ]
      .filter(Boolean)
      .join('\n')
  });
}

export async function sendPaymentEmail({
  to,
  name,
  orderId,
  outcome
}: EmailRecipient & {
  orderId: string;
  outcome: 'PAID' | 'LATE_PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
}) {
  const subjects = {
    PAID: `Pembayaran ${orderCode(orderId)} diterima`,
    LATE_PAID: `Pembayaran ${orderCode(orderId)} diterima setelah pembatalan`,
    FAILED: `Pembayaran ${orderCode(orderId)} gagal`,
    EXPIRED: `Pembayaran ${orderCode(orderId)} kedaluwarsa`,
    REFUNDED: `Pembayaran ${orderCode(orderId)} direfund`
  };
  const messages = {
    PAID: 'Pembayaran Anda telah kami terima. Pesanan akan segera diproses.',
    LATE_PAID:
      'Pembayaran Anda diterima setelah pesanan dibatalkan. Tim SILK akan menghubungi Anda untuk proses pengembalian dana.',
    FAILED: 'Pembayaran tidak berhasil. Anda dapat mencoba pembayaran kembali.',
    EXPIRED: 'Batas waktu pembayaran telah habis dan pesanan dibatalkan.',
    REFUNDED: 'Pembayaran pesanan Anda telah direfund.'
  };

  await sendSafe({
    to,
    subject: subjects[outcome],
    text: [
      `Halo ${name},`,
      '',
      `${messages[outcome]} (${orderCode(orderId)})`,
      '',
      `${getAppUrl()}/orders/${orderId}`,
      '',
      'Terima kasih telah menggunakan SILK.'
    ].join('\n')
  });
}

export async function sendConsultationStatusEmail({
  to,
  name,
  doctorName,
  scheduledAt,
  status,
  note
}: EmailRecipient & {
  doctorName: string;
  scheduledAt: Date;
  status: string;
  note?: string | null;
}) {
  await sendSafe({
    to,
    subject: `Konsultasi dengan ${doctorName}: ${consultationStatusLabels[status] ?? status}`,
    text: [
      `Halo ${name},`,
      '',
      `Status konsultasi Anda dengan ${doctorName} pada ${formatDateTime(scheduledAt)} sekarang: ${
        consultationStatusLabels[status] ?? status
      }.`,
      note ? `Catatan: ${note}` : '',
      '',
      `${getAppUrl()}/consultations`,
      '',
      'Terima kasih telah menggunakan SILK.'
    ]
      .filter(Boolean)
      .join('\n')
  });
}

export async function sendConsultationRequestEmail({
  to,
  name,
  patientName,
  scheduledAt,
  complaint
}: EmailRecipient & {
  patientName: string;
  scheduledAt: Date;
  complaint: string;
}) {
  await sendSafe({
    to,
    subject: `Permintaan konsultasi baru dari ${patientName}`,
    text: [
      `Halo ${name},`,
      '',
      `${patientName} mengajukan konsultasi pada ${formatDateTime(scheduledAt)}.`,
      `Keluhan: ${complaint}`,
      '',
      `${getAppUrl()}/doctor/consultations`,
      '',
      'Silakan konfirmasi atau batalkan jadwal melalui dashboard dokter.'
    ].join('\n')
  });
}

export async function sendConsultationCancelledToDoctorEmail({
  to,
  name,
  patientName,
  scheduledAt,
  reason
}: EmailRecipient & {
  patientName: string;
  scheduledAt: Date;
  reason?: string | null;
}) {
  await sendSafe({
    to,
    subject: `Konsultasi dibatalkan oleh ${patientName}`,
    text: [
      `Halo ${name},`,
      '',
      `${patientName} membatalkan konsultasi pada ${formatDateTime(scheduledAt)}.`,
      reason ? `Alasan: ${reason}` : '',
      '',
      `${getAppUrl()}/doctor/consultations`,
      '',
      'Terima kasih telah menggunakan SILK.'
    ]
      .filter(Boolean)
      .join('\n')
  });
}

export async function sendMedicalRecordEmail({
  to,
  name,
  doctorName
}: EmailRecipient & {
  doctorName: string;
}) {
  await sendSafe({
    to,
    subject: 'Rekam medis konsultasi Anda tersedia',
    text: [
      `Halo ${name},`,
      '',
      `Dokter ${doctorName} telah mengisi rekam medis konsultasi Anda.`,
      'Buka halaman riwayat konsultasi untuk melihat diagnosis, catatan, dan resep.',
      '',
      `${getAppUrl()}/medical-records`,
      '',
      'Terima kasih telah menggunakan SILK.'
    ].join('\n')
  });
}

export async function sendArticleModerationEmail({
  to,
  name,
  articleTitle,
  status,
  note,
  slug
}: EmailRecipient & {
  articleTitle: string;
  status: 'PUBLISHED' | 'REJECTED';
  note?: string | null;
  slug: string;
}) {
  const approved = status === 'PUBLISHED';

  await sendSafe({
    to,
    subject: approved ? 'Artikel Anda disetujui' : 'Artikel Anda perlu diperbaiki',
    text: [
      `Halo ${name},`,
      '',
      `Artikel "${articleTitle}" ${approved ? 'telah diterbitkan.' : 'belum disetujui.'}`,
      note ? `Catatan moderator: ${note}` : '',
      '',
      `${getAppUrl()}/article/${slug}`,
      '',
      'Terima kasih telah berkontribusi di SILK.'
    ]
      .filter(Boolean)
      .join('\n')
  });
}

export async function sendReviewModerationEmail({
  to,
  name,
  rating,
  status,
  note
}: EmailRecipient & {
  rating: number;
  status: 'APPROVED' | 'REJECTED';
  note?: string | null;
}) {
  const approved = status === 'APPROVED';

  await sendSafe({
    to,
    subject: approved ? 'Ulasan Anda telah ditayangkan' : 'Ulasan Anda belum disetujui',
    text: [
      `Halo ${name},`,
      '',
      `Ulasan Anda dengan rating ${rating}/5 ${approved ? 'telah ditayangkan.' : 'belum disetujui.'}`,
      note ? `Catatan moderator: ${note}` : '',
      '',
      'Terima kasih telah membantu pengguna lain memilih layanan di SILK.'
    ]
      .filter(Boolean)
      .join('\n')
  });
}

export async function sendReviewReceivedEmail({
  to,
  name,
  rating
}: EmailRecipient & {
  rating: number;
}) {
  await sendSafe({
    to,
    subject: 'Ulasan baru untuk layanan Anda',
    text: [
      `Halo ${name},`,
      '',
      `Ada ulasan baru dengan rating ${rating}/5 untuk layanan Anda.`,
      'Ulasan akan ditayangkan setelah melewati moderasi.',
      '',
      'Terima kasih telah menggunakan SILK.'
    ].join('\n')
  });
}

export async function sendPartnerVerificationEmail({
  to,
  name,
  partnerType,
  status,
  note
}: EmailRecipient & {
  partnerType: 'DOKTER' | 'FASILITAS';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  note?: string | null;
}) {
  const labels = {
    PENDING: 'menunggu peninjauan',
    VERIFIED: 'telah diverifikasi',
    REJECTED: 'ditolak'
  };

  await sendSafe({
    to,
    subject: `Verifikasi ${partnerType.toLowerCase()} ${labels[status]}`,
    text: [
      `Halo ${name},`,
      '',
      `Status verifikasi ${partnerType.toLowerCase()} Anda ${labels[status]}.`,
      note ? `Catatan: ${note}` : '',
      '',
      `${getAppUrl()}/partner`,
      '',
      'Terima kasih telah bergabung dengan SILK.'
    ]
      .filter(Boolean)
      .join('\n')
  });
}
