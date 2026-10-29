import { getAppUrl } from '@/lib/app-url';
import { sendTemplatedEmail } from '@/lib/email-template-store';
import type { EmailAudience } from '@/lib/email-templates';
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

async function sendSafe(input: {
  key: string;
  to: string;
  vars: Record<string, string>;
  audience?: EmailAudience;
}) {
  try {
    await sendTemplatedEmail(input);
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
    key: 'ORDER_CREATED',
    to,
    vars: {
      nama: name,
      kode_pesanan: orderCode(orderId),
      fasilitas: facilityName,
      total: rupiah.format(total),
      link: `${getAppUrl()}/orders/${orderId}`
    }
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
    key: 'ORDER_STATUS',
    to,
    vars: {
      nama: name,
      kode_pesanan: orderCode(orderId),
      status: orderStatusLabels[status] ?? status,
      catatan: note ?? '',
      link: `${getAppUrl()}/orders/${orderId}`
    }
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
  await sendSafe({
    key: `PAYMENT_${outcome}`,
    to,
    vars: {
      nama: name,
      kode_pesanan: orderCode(orderId),
      link: `${getAppUrl()}/orders/${orderId}`
    }
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
    key: 'CONSULTATION_STATUS',
    to,
    audience: 'PATIENT',
    vars: {
      nama: name,
      nama_dokter: doctorName,
      jadwal: formatDateTime(scheduledAt),
      status: consultationStatusLabels[status] ?? status,
      catatan: note ?? '',
      link: `${getAppUrl()}/consultations`
    }
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
    key: 'CONSULTATION_REQUEST',
    to,
    audience: 'DOCTOR',
    vars: {
      nama: name,
      nama_pasien: patientName,
      jadwal: formatDateTime(scheduledAt),
      keluhan: complaint,
      link: `${getAppUrl()}/doctor/consultations`
    }
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
    key: 'CONSULTATION_CANCELLED',
    to,
    audience: 'DOCTOR',
    vars: {
      nama: name,
      nama_pasien: patientName,
      jadwal: formatDateTime(scheduledAt),
      alasan: reason ?? '',
      link: `${getAppUrl()}/doctor/consultations`
    }
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
    key: 'MEDICAL_RECORD',
    to,
    audience: 'PATIENT',
    vars: {
      nama: name,
      nama_dokter: doctorName,
      link: `${getAppUrl()}/medical-records`
    }
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
  await sendSafe({
    key: status === 'PUBLISHED' ? 'ARTICLE_APPROVED' : 'ARTICLE_REJECTED',
    to,
    vars: {
      nama: name,
      judul_artikel: articleTitle,
      catatan: note ?? '',
      link: `${getAppUrl()}/article/${slug}`
    }
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
  await sendSafe({
    key: status === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
    to,
    vars: {
      nama: name,
      rating: String(rating),
      catatan: note ?? ''
    }
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
    key: 'REVIEW_RECEIVED',
    to,
    vars: {
      nama: name,
      rating: String(rating)
    }
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
    key: 'PARTNER_VERIFICATION',
    to,
    audience: partnerType === 'DOKTER' ? 'DOCTOR' : 'FACILITY',
    vars: {
      nama: name,
      jenis_mitra: partnerType.toLowerCase(),
      status: labels[status],
      catatan: note ?? '',
      link: `${getAppUrl()}/partner`
    }
  });
}
