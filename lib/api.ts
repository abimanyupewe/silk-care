import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { ZodType } from 'zod';
import { logError } from '@/lib/logger';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | `HTTP_${number}`;

export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

export type JsonParseResult<T> = { data: T; error?: never } | { data?: never; error: NextResponse };

export function jsonOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json(meta ? { data, meta } : { data });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function apiErrorCodeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    case 500:
      return 'INTERNAL_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return `HTTP_${status}`;
  }
}

export function jsonError(
  message: string,
  status = 400,
  details?: unknown,
  code: ApiErrorCode = apiErrorCodeForStatus(status)
) {
  const body = {
    error: message,
    code,
    ...(details === undefined ? {} : { details })
  };

  return NextResponse.json(body, {
    status
  });
}

export function jsonTooManyRequests(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  return NextResponse.json(
    {
      error: 'Terlalu banyak permintaan. Coba lagi nanti.',
      code: 'RATE_LIMITED' satisfies ApiErrorCode
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter)
      }
    }
  );
}

export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>
): Promise<JsonParseResult<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { error: jsonError('Body harus berupa JSON.', 400) };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      error: jsonError('Data tidak valid.', 422, parsed.error.flatten().fieldErrors)
    };
  }

  return { data: parsed.data };
}

export function getPagination(
  searchParams: URLSearchParams,
  defaultLimit = DEFAULT_LIMIT
): Pagination {
  const parsedPage = Number.parseInt(searchParams.get('page') ?? '', 10);
  const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, parsedLimit))
    : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

export function paginationMeta(total: number, pagination: Pagination) {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit)
  };
}

export function getString(
  searchParams: URLSearchParams,
  key: string,
  maxLength = 200
): string | undefined {
  const value = searchParams.get(key)?.trim();

  if (!value) {
    return undefined;
  }

  return value.slice(0, maxLength);
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function getInt(searchParams: URLSearchParams, key: string): number | undefined {
  const value = searchParams.get(key);
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getBoolean(searchParams: URLSearchParams, key: string): boolean | undefined {
  const value = searchParams.get(key)?.trim().toLowerCase();

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return undefined;
}

export function getEnum<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const value = searchParams.get(key)?.trim().toUpperCase();

  if (!value) {
    return undefined;
  }

  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export async function handleRouteError(error: unknown) {
  const requestId = (await headers()).get('x-request-id') ?? undefined;

  logError('api.route_error', error, {
    requestId
  });

  return jsonError('Terjadi kesalahan pada server.', 500);
}
