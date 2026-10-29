'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { adminDayLabels } from '@/lib/admin-format';

type Slot = { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean };

const days = [1, 2, 3, 4, 5, 6, 7];
const timeClass =
  'h-11 border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary';

export function DoctorSchedule() {
  const query = useApiQuery<Slot[]>('/doctor/schedule', 0);
  // null = belum diubah; tampilkan data server sampai dokter mengedit.
  const [draft, setDraft] = useState<Slot[] | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (query.loading && !query.data) return <AdminDetailSkeleton />;
  if (query.error) return <AdminErrorState message={query.error} onRetry={query.reload} />;
  if (!query.data) return null;

  const slots = draft ?? query.data;
  const edit = (next: Slot[]) => {
    setDraft(next);
    setSaved(false);
  };
  const change = (slot: Slot, patch: Partial<Slot>) =>
    edit(slots.map((item) => (item === slot ? { ...item, ...patch } : item)));

  async function save() {
    setSaving(true);
    setError('');
    try {
      const result = await fetchApi<Slot[]>('/doctor/schedule', {
        method: 'PUT',
        body: JSON.stringify({
          schedules: slots.map(({ dayOfWeek, startTime, endTime, isActive }) => ({
            dayOfWeek,
            startTime,
            endTime,
            isActive
          }))
        })
      });

      query.update(result.data);
      setDraft(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel dokter"
        title="Jadwal praktik"
        description="Pasien hanya dapat memesan konsultasi pada jam yang aktif di sini (zona waktu Jakarta)."
      />

      <div className="mt-6 max-w-2xl divide-y divide-border border border-border bg-white">
        {days.map((day) => {
          const daySlots = slots.filter((slot) => slot.dayOfWeek === day);

          return (
            <section key={day} className="p-4" aria-label={adminDayLabels[day]}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-ink">{adminDayLabels[day]}</h2>
                <button
                  type="button"
                  onClick={() =>
                    edit([
                      ...slots,
                      { dayOfWeek: day, startTime: '09:00', endTime: '12:00', isActive: true }
                    ])
                  }
                  className="inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
                >
                  Tambah jam
                </button>
              </div>
              {daySlots.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">Tidak ada jadwal.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {daySlots.map((slot, index) => (
                    <li key={index} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        aria-label={`${adminDayLabels[day]} jam mulai`}
                        value={slot.startTime}
                        onChange={(event) => change(slot, { startTime: event.target.value })}
                        className={timeClass}
                      />
                      <span className="text-sm text-ink-muted">sampai</span>
                      <input
                        type="time"
                        aria-label={`${adminDayLabels[day]} jam selesai`}
                        value={slot.endTime}
                        onChange={(event) => change(slot, { endTime: event.target.value })}
                        className={timeClass}
                      />
                      <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={slot.isActive}
                          onChange={(event) => change(slot, { isActive: event.target.checked })}
                          className="h-5 w-5 accent-[var(--color-primary)]"
                        />
                        Aktif
                      </label>
                      <button
                        type="button"
                        onClick={() => edit(slots.filter((item) => item !== slot))}
                        className="inline-flex h-11 items-center px-3 text-sm font-semibold text-destructive hover:bg-surface"
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="mt-4 text-sm font-medium text-primary-hover">
          Jadwal tersimpan.
        </p>
      ) : null}

      <button
        type="button"
        disabled={saving || draft === null}
        onClick={save}
        className="mt-4 inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? 'Menyimpan...' : 'Simpan jadwal'}
      </button>
    </div>
  );
}
