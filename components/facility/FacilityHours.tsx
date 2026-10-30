'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { adminDayLabels } from '@/lib/admin-format';

type Hour = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
};

const days = [1, 2, 3, 4, 5, 6, 7];
const timeClass =
  'h-11 border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary disabled:opacity-50';

export function FacilityHours() {
  const query = useApiQuery<Hour[]>('/facility/operating-hours', 0);
  // null = belum diubah; tampilkan data server sampai pengguna mengedit.
  const [draft, setDraft] = useState<Hour[] | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (query.loading && !query.data) return <AdminDetailSkeleton />;
  if (query.error) return <AdminErrorState message={query.error} onRetry={query.reload} />;
  if (!query.data) return null;

  // Hari tanpa baris di server dianggap tutup; menyimpan akan membuat baris untuk ketujuh hari.
  const hours =
    draft ??
    days.map(
      (day) =>
        query.data?.find((hour) => hour.dayOfWeek === day) ?? {
          dayOfWeek: day,
          openTime: null,
          closeTime: null,
          isClosed: true
        }
    );

  const change = (day: number, patch: Partial<Hour>) => {
    setDraft(hours.map((hour) => (hour.dayOfWeek === day ? { ...hour, ...patch } : hour)));
    setSaved(false);
  };

  async function save() {
    setSaving(true);
    setError('');
    try {
      const result = await fetchApi<Hour[]>('/facility/operating-hours', {
        method: 'PUT',
        body: JSON.stringify({
          operatingHours: hours.map(({ dayOfWeek, openTime, closeTime, isClosed }) => ({
            dayOfWeek,
            openTime,
            closeTime,
            isClosed
          }))
        })
      });

      query.update(result.data);
      setDraft(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jam operasional.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title="Jam operasional"
        description="Jam buka tampil di halaman publik dan dipakai untuk filter buka sekarang."
      />

      <ul className="mt-6 max-w-2xl divide-y divide-border border border-border bg-white">
        {hours.map((hour) => {
          const label = adminDayLabels[hour.dayOfWeek];

          return (
            <li key={hour.dayOfWeek} className="flex flex-wrap items-center gap-3 p-4">
              <span className="w-20 text-base font-bold text-ink">{label}</span>
              <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={!hour.isClosed}
                  onChange={(event) =>
                    change(hour.dayOfWeek, {
                      isClosed: !event.target.checked,
                      // Beri nilai awal saat dibuka pertama kali agar tidak lolos kosong.
                      openTime: hour.openTime ?? '08:00',
                      closeTime: hour.closeTime ?? '17:00'
                    })
                  }
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                Buka
              </label>
              {hour.isClosed ? (
                <span className="text-sm text-ink-muted">Tutup</span>
              ) : (
                <>
                  <input
                    type="time"
                    aria-label={`${label} jam buka`}
                    value={hour.openTime ?? ''}
                    onChange={(event) => change(hour.dayOfWeek, { openTime: event.target.value })}
                    className={timeClass}
                  />
                  <span className="text-sm text-ink-muted">sampai</span>
                  <input
                    type="time"
                    aria-label={`${label} jam tutup`}
                    value={hour.closeTime ?? ''}
                    onChange={(event) => change(hour.dayOfWeek, { closeTime: event.target.value })}
                    className={timeClass}
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="mt-4 text-sm font-medium text-primary-hover">
          Jam operasional tersimpan.
        </p>
      ) : null}

      <button
        type="button"
        disabled={saving || draft === null}
        onClick={save}
        className="mt-4 inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? 'Menyimpan...' : 'Simpan jam operasional'}
      </button>
    </div>
  );
}
