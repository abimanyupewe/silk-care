'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { VerificationBanner } from '@/components/panel/VerificationBanner';
import { useApiQuery } from '@/lib/api-swr';

type DoctorProfile = {
  specialty: string;
  bio: string | null;
  consultationFee: number | null;
  city: string | null;
  photoUrl: string | null;
  verificationStatus: string;
  user: { name: string };
  schedules: Array<{ id: string }>;
};

export function DoctorDashboard() {
  const profile = useApiQuery<DoctorProfile>('/doctor/profile', 60000);
  const requested = useApiQuery<unknown[]>('/doctor/consultations?status=REQUESTED&limit=1', 30000);
  const confirmed = useApiQuery<unknown[]>('/doctor/consultations?status=CONFIRMED&limit=1', 30000);
  const doctor = profile.data;

  if (profile.loading && !doctor) return <AdminDetailSkeleton />;
  if (profile.error) return <AdminErrorState message={profile.error} onRetry={profile.reload} />;
  if (!doctor) return null;

  const checklist = [
    { label: 'Spesialisasi', done: Boolean(doctor.specialty) },
    { label: 'Biodata singkat', done: Boolean(doctor.bio) },
    { label: 'Tarif konsultasi', done: doctor.consultationFee != null },
    { label: 'Kota praktik', done: Boolean(doctor.city) },
    { label: 'Foto profil', done: Boolean(doctor.photoUrl) },
    { label: 'Jadwal praktik', done: doctor.schedules.length > 0 }
  ];
  const remaining = checklist.filter((item) => !item.done).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel dokter"
        title={`Halo, ${doctor.user.name}`}
        description="Ringkasan konsultasi dan kelengkapan profil Anda."
      />

      <div className="mt-6">
        <VerificationBanner status={doctor.verificationStatus} />
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3" aria-label="Konsultasi">
        <div className="border border-border bg-white p-4">
          <p className="text-sm font-medium text-ink-muted">Menunggu konfirmasi Anda</p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {(requested.meta?.total ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="border border-border bg-white p-4">
          <p className="text-sm font-medium text-ink-muted">Terkonfirmasi</p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {(confirmed.meta?.total ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-4" aria-label="Kelengkapan profil">
        <h2 className="text-lg font-bold text-ink">Kelengkapan profil</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {remaining === 0 ? 'Profil Anda sudah lengkap.' : `${remaining} bagian belum dilengkapi.`}
        </p>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {checklist.map((item) => (
            <li key={item.label} className="flex min-h-11 items-center gap-3 py-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
              )}
              <span className="flex-1 text-ink">{item.label}</span>
              <span className="font-semibold text-ink">
                {item.done ? 'Lengkap' : 'Belum diisi'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
