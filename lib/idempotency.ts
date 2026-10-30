import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { IdempotencyScope as IdempotencyScopeValue, Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { jsonError } from '@/lib/api';

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

export type IdempotencyContext = {
  key: string;
  requestHash: string;
};

type IdempotencyRecord = {
  id: string;
  requestHash: string;
  responseStatus: number | null;
  responseBody: Prisma.JsonValue | null;
};

function canonicalize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = canonicalize((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

export function hashIdempotencyPayload(payload: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)))
    .digest('hex');
}

function readIdempotencyKey(request: Request): { key?: string; error?: NextResponse } {
  const raw = request.headers.get(IDEMPOTENCY_HEADER);

  if (raw === null) {
    return {};
  }

  const key = raw.trim();

  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    return {
      error: jsonError(
        'Idempotency-Key tidak valid. Gunakan 1-100 karakter huruf, angka, titik, garis bawah, titik dua, atau tanda hubung.',
        400
      )
    };
  }

  return { key };
}

async function findRecord(userId: string, scope: IdempotencyScopeValue, key: string) {
  const record = await prisma.idempotencyKey.findUnique({
    where: {
      userId_scope_key: {
        userId,
        scope,
        key
      }
    },
    select: {
      id: true,
      requestHash: true,
      responseStatus: true,
      responseBody: true,
      expiresAt: true
    }
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.idempotencyKey.deleteMany({
      where: {
        id: record.id
      }
    });

    return null;
  }

  return record;
}

function existingRecordResponse(record: IdempotencyRecord, requestHash: string) {
  if (record.requestHash !== requestHash) {
    return jsonError('Idempotency-Key sudah digunakan dengan payload berbeda.', 409);
  }

  if (record.responseStatus === null || record.responseBody === null) {
    return jsonError('Permintaan dengan Idempotency-Key ini sedang diproses.', 409);
  }

  return NextResponse.json(record.responseBody, {
    status: record.responseStatus,
    headers: {
      'Idempotent-Replayed': 'true'
    }
  });
}

export async function resolveIdempotency(
  request: Request,
  userId: string,
  scope: IdempotencyScopeValue,
  payload: unknown
): Promise<{ context?: IdempotencyContext; response?: NextResponse }> {
  const keyResult = readIdempotencyKey(request);

  if (keyResult.error) {
    return { response: keyResult.error };
  }

  if (!keyResult.key) {
    return {};
  }

  const requestHash = hashIdempotencyPayload(payload);
  const existing = await findRecord(userId, scope, keyResult.key);

  if (existing) {
    return { response: existingRecordResponse(existing, requestHash) };
  }

  return {
    context: {
      key: keyResult.key,
      requestHash
    }
  };
}

export async function replayIdempotency(
  userId: string,
  scope: IdempotencyScopeValue,
  key: string,
  requestHash: string
) {
  const existing = await findRecord(userId, scope, key);

  if (!existing) {
    return jsonError('Permintaan dengan Idempotency-Key ini sedang diproses.', 409);
  }

  return existingRecordResponse(existing, requestHash);
}

export async function createIdempotencyRecord(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    scope: IdempotencyScopeValue;
    context: IdempotencyContext;
  }
) {
  return tx.idempotencyKey.create({
    data: {
      userId: input.userId,
      scope: input.scope,
      key: input.context.key,
      requestHash: input.context.requestHash,
      expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS)
    },
    select: {
      id: true
    }
  });
}

export async function completeIdempotencyRecord(
  tx: Prisma.TransactionClient,
  id: string,
  input: {
    status: number;
    body: unknown;
    resourceId?: string;
  }
) {
  await tx.idempotencyKey.update({
    where: {
      id
    },
    data: {
      responseStatus: input.status,
      responseBody: JSON.parse(JSON.stringify(input.body)) as Prisma.InputJsonValue,
      resourceId: input.resourceId ?? null
    }
  });
}

export function isIdempotencyUniqueError(error: unknown) {
  return (
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'
  );
}

export async function cleanupExpiredIdempotencyKeys() {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return result.count;
}
