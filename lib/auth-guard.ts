import type { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/generated/prisma';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { jsonError } from '@/lib/api';

export type SessionUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type AuthResult = { ok: true; user: SessionUser } | { ok: false; error: NextResponse };

// Untuk halaman (bukan API): sesi hanya valid jika akunnya masih ada, aktif, dan sessionVersion
// cocok. Tanpa ini cookie lama membuat /admin dan /login saling melempar tanpa henti.
export async function getActiveSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      role: true,
      sessionVersion: true,
      deletedAt: true
    }
  });

  if (!user || user.deletedAt || user.sessionVersion !== session.user.sessionVersion) {
    return null;
  }

  return { user: { ...session.user, role: user.role } };
}

export async function requireUser(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: jsonError('Belum login.', 401) };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      id: true,
      role: true,
      sessionVersion: true,
      name: true,
      email: true,
      image: true,
      deletedAt: true
    }
  });

  if (!user || user.deletedAt) {
    return { ok: false, error: jsonError('Akun tidak aktif.', 401) };
  }

  if (session.user.sessionVersion !== user.sessionVersion) {
    return { ok: false, error: jsonError('Sesi berakhir. Silakan login kembali.', 401) };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      image: user.image
    }
  };
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
