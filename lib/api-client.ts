export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
};

export type ApiErrorBody = {
  error?: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Guard sisi klien untuk semua panel (admin, dokter, fasilitas): sesi habis/akun tidak valid
// (401) ke halaman masuk, peran tidak berhak (403) ke beranda. Promise sengaja tidak pernah selesai agar UI tidak sempat menampilkan error
// selama peramban berpindah halaman.
function leavePanel(status: 401 | 403): Promise<never> {
  if (status === 401) {
    const here = window.location.pathname + window.location.search;

    window.location.href = `/login?callbackUrl=${encodeURIComponent(here)}`;
  } else {
    window.location.href = '/';
  }

  return new Promise<never>(() => {});
}

export async function fetchApi<T>(path: string, init: RequestInit = {}) {
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

  const body = (await response.json().catch(() => null)) as (ApiEnvelope<T> & ApiErrorBody) | null;

  if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
    return leavePanel(response.status);
  }

  if (!response.ok) {
    throw new ApiError(
      body?.error ?? 'Permintaan gagal diproses.',
      response.status,
      body?.code,
      body?.details
    );
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new ApiError('Respons tidak valid.', response.status);
  }

  return body as ApiEnvelope<T>;
}
