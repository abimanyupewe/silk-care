import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, type SessionUser } from '@/lib/auth-guard';
import { jsonError } from '@/lib/api';
import { isServiceFacility, isShopFacility } from '@/lib/facility-types';

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

// Untuk route produk dan pesanan: hanya apotek (role PHARMACY) yang berjualan.
export async function requireShopFacility(): Promise<FacilityAuthResult> {
  const auth = await requireFacility();

  if (!auth.ok) {
    return auth;
  }

  if (!isShopFacility(auth.user.role)) {
    return { ok: false, error: jsonError('Fitur ini hanya tersedia untuk apotek.', 403) };
  }

  return auth;
}

// Untuk route layanan dan janji temu: semua fasilitas selain apotek.
export async function requireServiceFacility(): Promise<FacilityAuthResult> {
  const auth = await requireFacility();

  if (!auth.ok) {
    return auth;
  }

  if (!isServiceFacility(auth.user.role)) {
    return {
      ok: false,
      error: jsonError('Fitur ini hanya tersedia untuk fasilitas non-apotek.', 403)
    };
  }

  return auth;
}

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
