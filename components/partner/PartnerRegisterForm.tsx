'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useRef, useState } from 'react';
import { AlertCircle, MapPin } from 'lucide-react';
import { ApiError, fetchApi } from '@/lib/api-client';
import { facilityTypeLabels } from '@/lib/facility-types';
import { panelHomeForRole } from '@/lib/roles';
import { partnerRequirements } from '@/lib/partner-requirements/partners';
import { buildStepSchema } from '@/lib/partner-requirements/schema';
import {
  isPartnerType,
  partnerTypes,
  type PartnerType,
  type RequirementField
} from '@/lib/partner-requirements/types';
import { RequirementFields } from './RequirementFields';
import { AccountField, FormError, ReviewRow, fieldClass } from './register-parts';
import { buildFormSteps, cleanValues, fieldErrorText, type FormStepId } from './register-steps';

const secondaryButton =
  'inline-flex min-h-12 items-center justify-center border border-border-strong bg-white px-5 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60';

const typeLabel = (type: PartnerType) =>
  type === 'DOCTOR' ? 'Dokter' : facilityTypeLabels[type as keyof typeof facilityTypeLabels];

function formatValue(field: RequirementField, value: unknown) {
  if (value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (Array.isArray(value)) {
    const labels = value.map((v) => field.options?.find((o) => o.value === v)?.label ?? String(v));

    return labels.join(', ');
  }

  return field.options?.find((o) => o.value === value)?.label ?? String(value);
}

// withAccount: halaman publik; akun dibuat di akhir (Tinjau), bukan di awal.
export function PartnerRegisterForm({
  withAccount,
  lockedType
}: {
  withAccount: boolean;
  lockedType?: PartnerType;
}) {
  const router = useRouter();
  const [type, setType] = useState<PartnerType | undefined>(lockedType);
  const [stepId, setStepId] = useState<FormStepId>(withAccount ? 'account' : 'basic');
  const [account, setAccount] = useState({ name: '', email: '', password: '' });
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  // Akun sudah dibuat dan masuk; percobaan ulang hanya mengulang pendaftaran profil.
  const [accountReady, setAccountReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  const stepChangedAt = useRef(0);

  function changeStep(id: FormStepId) {
    stepChangedAt.current = performance.now();
    setStepId(id);
  }
  const [geoMessage, setGeoMessage] = useState('');

  const steps = buildFormSteps(type, withAccount);
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === stepId)
  );
  const step = steps[index];
  const allFields = type ? partnerRequirements[type].steps.flatMap((s) => s.fields) : [];
  const cleaned = cleanValues(allFields, values);
  const stepFields = step.registry.flatMap((s) => s.fields);

  function setValue(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validate(target: (typeof steps)[number]) {
    const next: Record<string, string> = {};

    if (target.id === 'account') {
      if (account.name.trim().length < 2) next.accountName = 'Isi nama lengkap (minimal 2 huruf).';
      if (!/^\S+@\S+\.\S+$/.test(account.email.trim())) next.email = 'Isi email yang valid.';
      if (account.password.length < 8 || account.password.length > 72) {
        next.password = 'Password 8 sampai 72 karakter.';
      }
    } else if (target.id === 'basic' && !type) {
      next.type = 'Pilih jenis mitra.';
    } else if (type) {
      const fields = target.registry.flatMap((s) => s.fields);

      for (const s of target.registry) {
        const result = buildStepSchema(s).safeParse(cleanValues(s.fields, values));

        if (!result.success) {
          for (const issue of result.error.issues) {
            const key = String(issue.path[0]);
            const field = fields.find((f) => f.key === key);

            next[key] = field ? fieldErrorText(field, cleaned) : 'Isian tidak valid.';
          }
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validate(step)) return;
    setFormError('');
    changeStep(steps[index + 1].id);
  }

  function goBack() {
    setFormError('');
    setErrors({});
    changeStep(steps[index - 1].id);
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoMessage('Peramban ini tidak mendukung lokasi. Isi lintang dan bujur secara manual.');
      return;
    }

    setGeoMessage('Mencari lokasi...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValues((prev) => ({
          ...prev,
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6))
        }));
        setErrors((prev) => ({ ...prev, latitude: '', longitude: '' }));
        setGeoMessage('Lokasi terisi. Periksa lintang dan bujur di bawah.');
      },
      (err) =>
        setGeoMessage(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Isi lintang dan bujur secara manual.'
            : 'Lokasi tidak ditemukan. Isi lintang dan bujur secara manual.'
        )
    );
  }

  async function submit() {
    if (!type || sending.current) return;
    sending.current = true;
    setSubmitting(true);
    setFormError('');
    setDuplicateEmail(false);
    let registered = accountReady;

    try {
      if (withAccount && !accountReady) {
        const email = account.email.trim();

        await fetchApi('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: account.name.trim(), email, password: account.password })
        });

        const result = await signIn('credentials', {
          email,
          password: account.password,
          redirect: false
        });

        registered = true;
        setAccountReady(true);

        if (!result || result.error) {
          throw new Error(
            'Akun dibuat, tetapi gagal masuk otomatis. Silakan masuk lewat halaman login.'
          );
        }
      }

      await fetchApi('/partner/registrations', {
        method: 'POST',
        body: JSON.stringify({ partnerType: type, values: cleaned })
      });

      // Role akun sudah berubah di DB; layout panel membacanya ulang, jadi cukup pindah.
      router.replace(panelHomeForRole(type === 'DOCTOR' ? 'DOCTOR' : 'FACILITY'));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && withAccount && !registered) {
        setDuplicateEmail(true);
        changeStep('account');
      } else if (err instanceof ApiError && err.status === 422 && err.details) {
        const details = err.details as Record<string, string[]>;
        const next = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v[0]]));
        const first = steps.find((s) =>
          s.registry.some((r) => r.fields.some((f) => f.key in next))
        );

        setErrors(next);
        if (first) changeStep(first.id);
      }
      setFormError(err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.');
      sending.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        // buang ekor double-click setelah pindah step
        if (performance.now() - stepChangedAt.current < 500) return;
        if (step.id === 'review') void submit();
        else goNext();
      }}
      className="space-y-4"
    >
      <p className="text-sm font-semibold text-ink" aria-live="polite">
        Langkah {index + 1} dari {steps.length}: {step.title}
      </p>

      {step.id === 'account' ? (
        <fieldset disabled={accountReady} className="space-y-4">
          <legend className="sr-only">Akun pemilik</legend>
          <AccountField
            id="account-name"
            label="Nama lengkap"
            autoComplete="name"
            value={account.name}
            error={errors.accountName}
            onChange={(v) => setAccount((a) => ({ ...a, name: v }))}
          />
          <AccountField
            id="account-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={account.email}
            error={errors.email}
            onChange={(v) => setAccount((a) => ({ ...a, email: v }))}
          />
          <AccountField
            id="account-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            help="Minimal 8 karakter."
            value={account.password}
            error={errors.password}
            onChange={(v) => setAccount((a) => ({ ...a, password: v }))}
          />
        </fieldset>
      ) : null}

      {step.id === 'basic' ? (
        <>
          {lockedType ? null : (
            <div>
              <label htmlFor="partner-type" className="text-sm font-semibold text-ink">
                Jenis mitra
              </label>
              <select
                id="partner-type"
                value={type ?? ''}
                aria-invalid={errors.type ? true : undefined}
                aria-describedby="partner-type-help"
                onChange={(e) => {
                  setType(isPartnerType(e.target.value) ? e.target.value : undefined);
                  setErrors({});
                }}
                className={`${fieldClass} h-12`}
              >
                <option value="">Pilih jenis mitra</option>
                {partnerTypes.map((value) => (
                  <option key={value} value={value}>
                    {typeLabel(value)}
                  </option>
                ))}
              </select>
              <p id="partner-type-help" className="mt-1 text-sm text-ink-muted">
                Jenis tidak bisa diubah sendiri setelah mendaftar.
              </p>
              <FormError message={errors.type} />
            </div>
          )}
          {type && lockedType ? (
            <p className="text-base text-ink">
              Jenis mitra: <span className="font-semibold">{typeLabel(type)}</span>
            </p>
          ) : null}
        </>
      ) : null}

      {stepFields.length > 0 ? (
        <RequirementFields
          fields={stepFields}
          values={values}
          errors={errors}
          onChange={setValue}
        />
      ) : null}

      {step.id === 'location' ? (
        // shortcut: pemilih titik di peta menyusul setelah key Google Maps ada (Fase 3)
        <div>
          <button type="button" onClick={useMyLocation} className={secondaryButton}>
            <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
            Gunakan lokasi saya
          </button>
          <p className="mt-2 text-sm text-ink-muted" aria-live="polite">
            {geoMessage}
          </p>
        </div>
      ) : null}

      {step.id === 'review' ? (
        <div className="space-y-4">
          {withAccount ? (
            <dl className="border border-border p-4 text-base">
              <ReviewRow label="Nama akun" value={account.name} />
              <ReviewRow label="Email" value={account.email} />
            </dl>
          ) : null}
          {type ? (
            <dl className="border border-border p-4 text-base">
              <ReviewRow label="Jenis mitra" value={typeLabel(type)} />
              {allFields.map((f) => (
                <ReviewRow key={f.key} label={f.label} value={formatValue(f, cleaned[f.key])} />
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      {formError ? (
        <p className="flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {formError}
            {duplicateEmail ? (
              <>
                {' '}
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/mitra/daftar${type ? `?type=${type}` : ''}`)}`}
                  className="font-semibold underline"
                >
                  Masuk dengan akun ini
                </Link>
              </>
            ) : null}
          </span>
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {index > 0 ? (
          <button type="button" onClick={goBack} disabled={submitting} className={secondaryButton}>
            Kembali
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 items-center justify-center bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {step.id !== 'review'
            ? 'Lanjut'
            : submitting
              ? 'Mengirim...'
              : withAccount
                ? 'Buat akun dan daftar'
                : 'Daftar sebagai mitra'}
        </button>
      </div>
    </form>
  );
}
