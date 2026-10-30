'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ApiError, fetchApi } from '@/lib/api-client';

const fieldClass =
  'mt-2 h-12 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary';

export function PatientRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    setError('');
    setDuplicateEmail(false);
    setSubmitting(true);
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: String(form.get('name') ?? '').trim(), email, password })
      });

      const result = await signIn('credentials', { email, password, redirect: false });

      if (!result?.ok) {
        router.replace('/login');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (err) {
      setDuplicateEmail(err instanceof ApiError && err.status === 409);
      setError(err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="patient-name" className="text-sm font-semibold text-ink">
          Nama lengkap
        </label>
        <input
          id="patient-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="patient-email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="patient-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
          placeholder="nama@email.com"
        />
      </div>
      <div>
        <label htmlFor="patient-password" className="text-sm font-semibold text-ink">
          Password
        </label>
        <input
          id="patient-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          aria-describedby="patient-password-help"
          className={fieldClass}
        />
        <p id="patient-password-help" className="mt-1 text-sm text-ink-muted">
          Minimal 8 karakter.
        </p>
      </div>

      {error ? (
        <p className="flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {error}
            {duplicateEmail ? (
              <>
                {' '}
                <Link href="/login" className="font-semibold underline">
                  Masuk dengan akun ini
                </Link>
              </>
            ) : null}
          </span>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Membuat akun...' : 'Buat akun'}
      </button>
    </form>
  );
}
