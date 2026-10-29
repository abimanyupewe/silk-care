'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import {
  AdminApiError,
  adminUserRoleLabels,
  fetchAdmin,
  type AdminUserRole
} from '@/lib/admin-api';

type Audience = 'ALL' | 'ROLE' | 'USER';

const audienceLabels: Record<Audience, string> = {
  ALL: 'Semua pengguna aktif',
  ROLE: 'Berdasarkan peran',
  USER: 'Pengguna terpilih'
};

function parseUserIds(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ];
}

export function AdminBroadcast() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('ALL');
  const [roles, setRoles] = useState<AdminUserRole[]>([]);
  const [userIds, setUserIds] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedUserIds = parseUserIds(userIds);

  const validate = () => {
    if (!title.trim()) return 'Judul notifikasi wajib diisi.';
    if (!body.trim()) return 'Isi notifikasi wajib diisi.';
    if (audience === 'ROLE' && roles.length === 0) return 'Pilih minimal satu peran.';
    if (audience === 'USER' && selectedUserIds.length === 0) {
      return 'Masukkan minimal satu ID pengguna.';
    }
    return '';
  };

  const prepare = () => {
    const message = validate();

    if (message) {
      setError(message);
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setConfirming(true);
  };

  const send = async () => {
    setPending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchAdmin<{ recipients: number; audience: Audience }>(
        '/admin/notifications/broadcast',
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            audience,
            ...(audience === 'ROLE' ? { roles } : {}),
            ...(audience === 'USER' ? { userIds: selectedUserIds } : {})
          })
        }
      );

      setSuccess(
        `Broadcast terkirim ke ${response.data.recipients.toLocaleString('id-ID')} pengguna.`
      );
      setConfirming(false);
      setTitle('');
      setBody('');
      setAudience('ALL');
      setRoles([]);
      setUserIds('');
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/broadcast';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Gagal mengirim broadcast.');
      setConfirming(false);
    } finally {
      setPending(false);
    }
  };

  const toggleRole = (role: AdminUserRole) => {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
    );
    setConfirming(false);
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Komunikasi"
        title="Broadcast notifikasi"
        description="Kirim pengumuman sistem ke semua pengguna aktif, peran tertentu, atau pengguna terpilih."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-border bg-white p-5">
          <h2 className="text-lg font-bold text-ink">Susun notifikasi</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Notifikasi langsung masuk ke pusat notifikasi pengguna. Tindakan ini tidak dapat
            dibatalkan.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-ink">
              Judul
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setConfirming(false);
                }}
                maxLength={200}
                placeholder="Contoh: Pemeliharaan layanan 30 Oktober"
                className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
              />
              <span className="mt-1 block text-xs text-ink-faint">{title.length}/200 karakter</span>
            </label>

            <label className="block text-sm font-medium text-ink">
              Isi notifikasi
              <textarea
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setConfirming(false);
                }}
                maxLength={2000}
                rows={6}
                placeholder="Tulis informasi yang akan diterima pengguna..."
                className="mt-1 w-full border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
              />
              <span className="mt-1 block text-xs text-ink-faint">{body.length}/2000 karakter</span>
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-ink">Penerima</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(Object.keys(audienceLabels) as Audience[]).map((value) => (
                  <label
                    key={value}
                    className="flex min-h-11 cursor-pointer items-center gap-2 border border-border-strong px-3 text-sm text-ink hover:border-primary hover:bg-primary-tint"
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={value}
                      checked={audience === value}
                      onChange={() => {
                        setAudience(value);
                        setConfirming(false);
                        setError('');
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    {audienceLabels[value]}
                  </label>
                ))}
              </div>
            </fieldset>

            {audience === 'ROLE' ? (
              <fieldset>
                <legend className="text-sm font-medium text-ink">Pilih peran</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(Object.keys(adminUserRoleLabels) as AdminUserRole[]).map((role) => (
                    <label
                      key={role}
                      className="flex min-h-11 cursor-pointer items-center gap-2 border border-border-strong px-3 text-sm text-ink hover:border-primary hover:bg-primary-tint"
                    >
                      <input
                        type="checkbox"
                        checked={roles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="h-4 w-4 accent-primary"
                      />
                      {adminUserRoleLabels[role]}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {audience === 'USER' ? (
              <label className="block text-sm font-medium text-ink">
                ID pengguna
                <textarea
                  value={userIds}
                  onChange={(event) => {
                    setUserIds(event.target.value);
                    setConfirming(false);
                  }}
                  rows={3}
                  placeholder="Pisahkan dengan koma atau baris baru"
                  className="mt-1 w-full border border-border-strong bg-white px-3 py-2 font-mono text-sm text-ink outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-primary"
                />
                <span className="mt-1 block text-xs text-ink-faint">
                  {selectedUserIds.length} ID terdeteksi
                </span>
              </label>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 flex items-start gap-2 text-sm text-destructive" aria-live="polite">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}

          {success ? (
            <p
              className="mt-4 flex items-start gap-2 text-sm text-primary-hover"
              aria-live="polite"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {success}
            </p>
          ) : null}

          {confirming ? (
            <div className="mt-4 border border-amber bg-amber-tint p-4">
              <p className="text-sm font-semibold text-ink">Konfirmasi broadcast</p>
              <p className="mt-1 text-sm text-ink">
                Kirim “{title.trim()}” ke {audienceLabels[audience].toLowerCase()}
                {audience === 'ROLE'
                  ? `: ${roles.map((role) => adminUserRoleLabels[role]).join(', ')}`
                  : audience === 'USER'
                    ? ` (${selectedUserIds.length} ID)`
                    : ''}
                ?
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={send}
                  disabled={pending}
                  aria-busy={pending}
                  className="inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? 'Mengirim...' : 'Ya, kirim broadcast'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="inline-flex min-h-11 items-center justify-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={prepare}
              className="mt-4 inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Kirim broadcast
            </button>
          )}
        </section>

        <aside className="space-y-4">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Ringkasan</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-muted">Penerima</dt>
                <dd className="text-right font-medium text-ink">{audienceLabels[audience]}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-muted">Judul</dt>
                <dd className="text-right font-medium text-ink">{title.trim() || '—'}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-muted">Tipe</dt>
                <dd className="text-right font-medium text-ink">Sistem</dd>
              </div>
            </dl>
          </section>

          <section className="border border-border bg-surface p-5">
            <h2 className="text-sm font-bold text-ink">Perhatian</h2>
            <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-ink-muted">
              <li>Broadcast hanya dikirim ke akun aktif.</li>
              <li>Notifikasi tidak dapat ditarik setelah dikirim.</li>
              <li>Pengiriman dibatasi untuk mencegah spam.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
