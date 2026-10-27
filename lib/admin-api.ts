export type AdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminApiEnvelope<T> = {
  data: T;
  meta?: AdminPaginationMeta | Record<string, unknown>;
};

export type AdminApiErrorBody = {
  error?: string;
  code?: string;
  details?: unknown;
};

export class AdminApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function fetchAdmin<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path.startsWith('/api/') ? path : `/api/v1${path}`, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store'
  });

  const body = (await response.json().catch(() => null)) as
    | (AdminApiEnvelope<T> & AdminApiErrorBody)
    | null;

  if (!response.ok) {
    throw new AdminApiError(
      body?.error ?? 'Permintaan admin gagal diproses.',
      response.status,
      body?.code,
      body?.details
    );
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new AdminApiError('Respons admin tidak valid.', response.status);
  }

  return body as AdminApiEnvelope<T>;
}

export type AdminStats = {
  generatedAt: string;
  users: {
    total: number;
    active: number;
    deleted: number;
    byRole: Record<string, number>;
  };
  partners: {
    doctors: {
      total: number;
      PENDING: number;
      VERIFIED: number;
      REJECTED: number;
    };
    facilities: {
      total: number;
      PENDING: number;
      VERIFIED: number;
      REJECTED: number;
    };
  };
  catalog: {
    articles: {
      total: number;
      published: number;
      pending: number;
      draft: number;
      rejected: number;
      deleted: number;
    };
    products: {
      total: number;
      active: number;
      inactive: number;
      deleted: number;
    };
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    byPaymentStatus: Record<string, number>;
    revenue: number;
  };
  reviews: {
    total: number;
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
  };
  moderation: {
    pendingDoctors: number;
    pendingFacilities: number;
    pendingReviews: number;
    totalPending: number;
  };
  recentOrders: Array<{
    id: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
    facility: {
      id: string;
      slug: string;
      name: string;
    };
  }>;
};

export type AdminUserRole = 'PATIENT' | 'DOCTOR' | 'FACILITY' | 'PHARMACY' | 'ADMIN';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: AdminUserRole;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  doctorProfile: {
    id: string;
    slug: string;
    specialty: string;
    verificationStatus: AdminVerificationStatus;
  } | null;
  facility: {
    id: string;
    slug: string;
    name: string;
    type: string;
    verificationStatus: AdminVerificationStatus;
  } | null;
};

export const adminUserRoleLabels: Record<AdminUserRole, string> = {
  PATIENT: 'Pasien',
  DOCTOR: 'Dokter',
  FACILITY: 'Fasilitas',
  PHARMACY: 'Farmasi',
  ADMIN: 'Admin'
};

export type AdminOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';
export type AdminPaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export type AdminOrderItem = {
  id: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  quantity: number;
  price: number;
};

export type AdminOrder = {
  id: string;
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  shippingCity: string;
  facility: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
    type: string;
  };
  items: AdminOrderItem[];
};

export type AdminOrderDetail = {
  id: string;
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  total: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  notes: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
    type: string;
    phone: string | null;
  };
  items: Array<AdminOrderItem & { productId: string }>;
  statusHistory: Array<{
    id: string;
    status: AdminOrderStatus;
    note: string | null;
    createdAt: string;
    changedBy: {
      name: string;
    } | null;
  }>;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    redirectUrl: string | null;
    expiresAt: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
};

export const adminOrderStatusLabels: Record<AdminOrderStatus, string> = {
  PENDING: 'Menunggu',
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

export const adminPaymentStatusLabels: Record<AdminPaymentStatus, string> = {
  UNPAID: 'Belum dibayar',
  PAID: 'Dibayar',
  FAILED: 'Gagal',
  REFUNDED: 'Dikembalikan'
};

export const adminOrderNextStatuses: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  PENDING: ['CANCELLED'],
  PAID: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
};

export type AdminVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AdminReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AdminReviewTargetType = 'doctor' | 'facility' | 'product';

export type AdminDoctorSchedule = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type AdminDoctor = {
  id: string;
  slug: string;
  specialty: string;
  bio: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  verificationStatus: AdminVerificationStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    deletedAt: string | null;
  };
};

export type AdminDoctorDetail = AdminDoctor & {
  photoUrl: string | null;
  photoPublicId: string | null;
  videoUrl: string | null;
  videoPublicId: string | null;
  schedules: AdminDoctorSchedule[];
};

export type AdminFacilityOperatingHour = {
  id: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
};

export type AdminFacility = {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  verificationStatus: AdminVerificationStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    deletedAt: string | null;
  };
  _count: {
    products: number;
  };
};

export type AdminFacilityDetail = AdminFacility & {
  photoUrl: string | null;
  photoPublicId: string | null;
  videoUrl: string | null;
  videoPublicId: string | null;
  operatingHours: AdminFacilityOperatingHour[];
};

export type AdminAuditTargetType =
  | 'USER'
  | 'DOCTOR'
  | 'FACILITY'
  | 'ARTICLE'
  | 'ORDER'
  | 'REVIEW'
  | 'NOTIFICATION';

export type AdminAuditLog = {
  id: string;
  action: string;
  targetType: AdminAuditTargetType;
  targetId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: AdminUserRole;
  };
};

export const adminAuditTargetLabels: Record<AdminAuditTargetType, string> = {
  USER: 'Pengguna',
  DOCTOR: 'Dokter',
  FACILITY: 'Fasilitas',
  ARTICLE: 'Artikel',
  ORDER: 'Pesanan',
  REVIEW: 'Ulasan',
  NOTIFICATION: 'Notifikasi'
};

export type AdminArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';

export type AdminArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  coverPublicId: string | null;
  status: AdminArticleStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    id: string;
    name: string;
    email: string;
  };
};

export const adminArticleStatusLabels: Record<AdminArticleStatus, string> = {
  DRAFT: 'Draf',
  PENDING: 'Menunggu',
  PUBLISHED: 'Terbit',
  REJECTED: 'Ditolak'
};

export type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: AdminReviewStatus;
  isNegative: boolean;
  moderationNote: string | null;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  doctorProfileId: string | null;
  facilityId: string | null;
  productId: string | null;
  author: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    deletedAt: string | null;
  };
  doctorProfile: {
    id: string;
    slug: string;
    specialty: string;
    verificationStatus: AdminVerificationStatus;
    user: {
      name: string;
      email: string;
    };
  } | null;
  facility: {
    id: string;
    slug: string;
    name: string;
    type: string;
    verificationStatus: AdminVerificationStatus;
  } | null;
  product: {
    id: string;
    slug: string;
    name: string;
    facility: {
      id: string;
      slug: string;
      name: string;
    };
  } | null;
  moderatedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  targetType: AdminReviewTargetType;
};

export const adminVerificationStatusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak'
};

export const adminReviewStatusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak'
};

export const adminFacilityTypeLabels: Record<string, string> = {
  HOSPITAL: 'Rumah sakit',
  CLINIC: 'Klinik',
  LABORATORY: 'Laboratorium',
  PHARMACY: 'Apotek',
  PHYSIOTHERAPY: 'Fisioterapi',
  RADIOLOGY: 'Radiologi',
  FUNERAL_HOME: 'Rumah duka',
  WELLNESS: 'Wellness'
};

export const adminReviewTargetLabels: Record<AdminReviewTargetType, string> = {
  doctor: 'Dokter',
  facility: 'Fasilitas',
  product: 'Produk'
};
