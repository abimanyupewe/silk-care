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
