import type { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/generated/prisma';
import { auth } from '@/auth';
import { jsonError } from '@/lib/api';

export type SessionUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type AuthResult = { ok: true; user: SessionUser } | { ok: false; error: NextResponse };

export async function requireUser(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: jsonError('Belum login.', 401) };
  }

  return { ok: true, user: session.user };
}

export async function requireRole(roles: readonly UserRole[]): Promise<AuthResult> {
  const result = await requireUser();

  if (!result.ok) {
    return result;
  }

  if (!roles.includes(result.user.role)) {
    return { ok: false, error: jsonError('Akses ditolak.', 403) };
  }

  return result;
}
