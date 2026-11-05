'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { VerificationBanner } from '@/components/panel/VerificationBanner';
import { useApiQuery } from '@/lib/api-swr';
import { transactionsEnabled } from '@/lib/features';
import { formatAdminDateTime } from '@/lib/admin-format';

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

type UpcomingConsultation = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  type: 'ONLINE' | 'IN_PERSON';
  patient: { name: string };
};

export function DoctorDashboard() {
  const profile = useApiQuery<DoctorProfile>('/doctor/profile', 60000);
  const requested = useApiQuery<unknown[]>(
    transactionsEnabled ? '/doctor/consultations?status=REQUESTED&limit=1' : null,
    30000
  );
  // shortcut: API tanpa filter tanggal dan urut terbaru dulu; ambil 50 lalu saring di klien, upgrade bila dokter punya >50 konsultasi terkonfirmasi.
  const confirmed = useApiQuery<UpcomingConsultation[]>(
    transactionsEnabled ? '/doctor/consultations?status=CONFIRMED&limit=50' : null,
    30000
  );
  const doctor = profile.data;
  const now = Date.now();
  const upcoming = (confirmed.data ?? [])
    .filter((item) => new Date(item.scheduledAt).getTime() >= now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, 5);

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
        description={
          transactionsEnabled
            ? 'Ringkasan konsultasi dan kelengkapan profil Anda.'
            : 'Ringkasan kelengkapan profil Anda.'
        }
      />

      <div className="mt-6">
        <VerificationBanner status={doctor.verificationStatus} />
      </div>

      {transactionsEnabled && (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3" aria-label="Konsultasi">
            <Link
              href="/dashboard/dokter/konsultasi"
              className="block min-h-11 border border-border bg-white p-4 hover:border-primary"
            >
              <p className="text-sm font-medium text-ink-muted">Menunggu konfirmasi Anda</p>
              <p className="mt-2 text-2xl font-bold text-ink">
                {(requested.meta?.total ?? 0).toLocaleString('id-ID')}
              </p>
            </Link>
            <Link
              href="/dashboard/dokter/konsultasi"
              className="block min-h-11 border border-border bg-white p-4 hover:border-primary"
            >
              <p className="text-sm font-medium text-ink-muted">Terkonfirmasi</p>
              <p className="mt-2 text-2xl font-bold text-ink">
                {(confirmed.meta?.total ?? 0).toLocaleString('id-ID')}
              </p>
            </Link>
          </section>

          <section className="mt-6 border border-border bg-white p-4" aria-label="Jadwal mendatang">
            <h2 className="text-lg font-bold text-ink">Jadwal mendatang</h2>
            {upcoming.length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">Belum ada konsultasi terkonfirmasi.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="flex min-h-11 flex-wrap items-center gap-x-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-ink">{item.patient.name}</span>
                    <span className="flex-1 text-ink-muted">
                      {formatAdminDateTime(item.scheduledAt)} · {item.durationMinutes} menit ·{' '}
                      {item.type === 'ONLINE' ? 'Online' : 'Tatap muka'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

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
