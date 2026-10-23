import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, type SessionUser } from '@/lib/auth-guard';
import { jsonError } from '@/lib/api';

type FacilityProfile = {
  id: string;
  name: string;
  slug: string;
};

type FacilityAuthResult =
  | {
      ok: true;
      user: SessionUser;
      facility: FacilityProfile;
    }
  | {
      ok: false;
      error: NextResponse;
    };

export async function requireFacility(): Promise<FacilityAuthResult> {
  const auth = await requireRole(['FACILITY', 'PHARMACY']);

  if (!auth.ok) {
    return auth;
  }

  const facility = await prisma.facility.findUnique({
    where: {
      userId: auth.user.id
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  if (!facility) {
    return { ok: false, error: jsonError('Profil fasilitas tidak ditemukan.', 404) };
  }

  return {
    ok: true,
    user: auth.user,
    facility
  };
}
