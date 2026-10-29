'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Pencil } from 'lucide-react';
import { AdminConfirmDialog } from '@/components/admin/AdminModal';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { useAdminQuery } from '@/lib/admin-swr';
import {
  AdminApiError,
  fetchAdmin,
  type AdminEmailTemplate,
  type AdminEmailTemplateVersion
} from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';
import {
  emailAudiences,
  emailAudienceLabels,
  renderEmailSubject,
  renderEmailText,
  validateEmailTemplate,
  type EmailAudience
} from '@/lib/email-templates';
import { cn } from '@/lib/utils';

const fieldClass =
  'w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary';

export function AdminEmailTemplates() {
  // refreshInterval 0: polling tidak boleh menimpa draf yang sedang diketik.
  const { data, loading, error, reload } = useAdminQuery<AdminEmailTemplate[]>(
    '/admin/email-templates',
    0
  );
  const templates = useMemo(() => data ?? [], [data]);
  const [audience, setAudience] = useState<EmailAudience>('PATIENT');
  const [selectedKey, setSelectedKey] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState<'save' | 'reset' | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const def = templates.find((template) => template.key === (selectedKey || templates[0]?.key));
  const version: AdminEmailTemplateVersion | undefined = def?.audiences[audience];
  const loaded = templates.length > 0;

  // Draf hanya dimuat ulang saat pilihan berubah, bukan tiap data di-revalidasi.
  useEffect(() => {
    if (!def || !version) return;

    setSubject(version.subject);
    setBody(version.body);
    setMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def?.key, audience, loaded]);

  const groups = useMemo(() => {
    const map = new Map<string, AdminEmailTemplate[]>();

    for (const template of templates) {
      map.set(template.group, [...(map.get(template.group) ?? []), template]);
    }

    return [...map.entries()];
  }, [templates]);

  const sampleVars = useMemo(
    () => Object.fromEntries((def?.variables ?? []).map((item) => [item.name, item.sample])),
    [def]
  );

  if (loading && !data) return <AdminDetailSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;
  if (!def || !version) return null;

  const dirty = subject !== version.subject || body !== version.body;
  const endpoint = `/admin/email-templates/${def.key}/${audience}`;

  const insertVariable = (name: string) => {
    const field = bodyRef.current;
    const token = `{{${name}}}`;

    if (!field) {
      setBody((value) => value + token);
      return;
    }

    const start = field.selectionStart;
    const end = field.selectionEnd;

    setBody(body.slice(0, start) + token + body.slice(end));
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const run = async (action: 'save' | 'reset') => {
    const invalid = action === 'save' ? validateEmailTemplate(def, subject, body) : null;

    if (invalid) {
      setMessage({ type: 'error', text: invalid });
      return;
    }

    setPending(action);
    setMessage(null);

    try {
      const response = await fetchAdmin<AdminEmailTemplateVersion>(endpoint, {
        method: action === 'save' ? 'PUT' : 'DELETE',
        body: action === 'save' ? JSON.stringify({ subject, body }) : undefined
      });

      setSubject(response.data.subject);
      setBody(response.data.body);
      reload();
      setMessage({
        type: 'success',
        text:
          action === 'save'
            ? 'Template disimpan. Berlaku untuk email berikutnya.'
            : 'Template dikembalikan ke teks default.'
      });
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/email-templates';
        return;
      }

      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Gagal menyimpan template.'
      });
    } finally {
      setPending(null);
      setConfirmReset(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Sistem"
        title="Template email"
        description="Atur isi email yang dikirim sistem. Setiap audiens (pengguna, dokter, fasilitas) bisa punya versi sendiri; tanpa perubahan, teks default dipakai."
      />

      <div
        role="tablist"
        aria-label="Audiens email"
        className="mt-6 inline-flex border border-border-strong bg-white"
      >
        {emailAudiences.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={audience === item}
            onClick={() => setAudience(item)}
            className={cn(
              'min-h-11 px-4 text-sm font-semibold',
              audience === item ? 'bg-primary text-white' : 'text-ink hover:bg-surface'
            )}
          >
            {emailAudienceLabels[item]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Daftar template" className="space-y-4">
          {groups.map(([group, items]) => (
            <div key={group}>
              <p className="pb-1 text-sm font-semibold text-ink-faint">{group}</p>
              <ul className="border border-border bg-white">
                {items.map((item) => {
                  const active = item.key === def.key;
                  const customized = item.audiences[audience].customized;

                  return (
                    <li key={item.key} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setSelectedKey(item.key)}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'flex min-h-11 w-full items-center justify-between gap-2 border-l-4 px-3 py-2 text-left text-sm',
                          active
                            ? 'border-amber bg-primary-tint font-semibold text-primary-hover'
                            : 'border-transparent text-ink hover:bg-surface'
                        )}
                      >
                        <span>{item.label}</span>
                        {customized ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-primary-hover">
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Diubah
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">{def.label}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {def.description} Untuk audiens <strong>{emailAudienceLabels[audience]}</strong>.
            </p>
            <p className="mt-1 text-sm text-ink-faint">
              {version.customized && version.updatedAt
                ? `Versi kustom, terakhir diubah ${formatAdminDateTime(version.updatedAt)}.`
                : 'Memakai teks default.'}
            </p>

            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-ink">
                Subjek
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={200}
                  className={cn(fieldClass, 'mt-1 h-11')}
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Isi email
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={5000}
                  rows={14}
                  className={cn(fieldClass, 'mt-1 py-2 font-mono leading-6')}
                />
              </label>

              <div>
                <p className="text-sm font-medium text-ink">Variabel (klik untuk menyisipkan)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {def.variables.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => insertVariable(item.name)}
                      title={item.label}
                      className="inline-flex min-h-11 items-center border border-border-strong px-3 font-mono text-sm text-ink hover:border-primary hover:bg-primary-tint"
                    >
                      {`{{${item.name}}}`}
                      {def.required.includes(item.name) ? (
                        <span className="ml-2 font-sans text-sm text-amber-ink">wajib</span>
                      ) : null}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-ink-faint">
                  Baris yang variabelnya kosong (mis. catatan opsional) otomatis dihilangkan.
                </p>
              </div>
            </div>

            {message ? (
              <p
                role={message.type === 'error' ? 'alert' : 'status'}
                className={cn(
                  'mt-4 flex items-start gap-2 text-sm',
                  message.type === 'error' ? 'text-destructive' : 'text-primary-hover'
                )}
              >
                {message.type === 'error' ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                {message.text}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => run('save')}
                disabled={!dirty || pending !== null}
                aria-busy={pending === 'save'}
                className="inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending === 'save' ? 'Menyimpan...' : 'Simpan template'}
              </button>
              {version.customized ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  disabled={pending !== null}
                  className="inline-flex min-h-11 items-center justify-center border border-destructive px-4 text-sm font-semibold text-destructive hover:bg-surface disabled:opacity-50"
                >
                  Kembalikan ke default
                </button>
              ) : null}
            </div>
          </section>

          <section className="border border-border bg-white p-5" aria-label="Pratinjau">
            <h2 className="text-lg font-bold text-ink">Pratinjau</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Memakai data contoh. Email asli memakai data transaksi sebenarnya.
            </p>
            <div className="mt-4 border border-border">
              <p className="border-b border-border bg-surface px-4 py-3 text-sm">
                <span className="text-ink-faint">Subjek: </span>
                <span className="font-semibold text-ink">
                  {renderEmailSubject(subject, sampleVars)}
                </span>
              </p>
              <pre className="whitespace-pre-wrap break-words px-4 py-4 font-sans text-sm leading-6 text-ink">
                {renderEmailText(body, sampleVars)}
              </pre>
            </div>
          </section>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmReset}
        title="Kembalikan ke teks default?"
        description={`Versi kustom "${def.label}" untuk ${emailAudienceLabels[audience]} akan dihapus dan email berikutnya memakai teks default.`}
        confirmLabel="Ya, kembalikan"
        pendingLabel="Mengembalikan..."
        pending={pending === 'reset'}
        onConfirm={() => run('reset')}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
