import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, type SessionUser } from '@/lib/auth-guard';
import { jsonError } from '@/lib/api';

type DoctorProfile = {
  id: string;
  slug: string;
  verificationStatus: string;
};

type DoctorAuthResult =
  | {
      ok: true;
      user: SessionUser;
      doctor: DoctorProfile;
    }
  | {
      ok: false;
      error: NextResponse;
    };

export async function requireDoctorProfile(): Promise<DoctorAuthResult> {
  const auth = await requireRole(['DOCTOR']);

  if (!auth.ok) {
    return auth;
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: {
      userId: auth.user.id
    },
    select: {
      id: true,
      slug: true,
      verificationStatus: true
    }
  });

  if (!doctor) {
    return { ok: false, error: jsonError('Profil dokter tidak ditemukan.', 404) };
  }

  return {
    ok: true,
    user: auth.user,
    doctor
  };
}
