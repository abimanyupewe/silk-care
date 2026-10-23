'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  if (!token) {
    return (
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <p className="font-semibold text-ink">Token tidak ditemukan</p>
          <p className="mt-1 text-ink-muted">
            Buka tautan reset password dari email Anda untuk melanjutkan.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div aria-live="polite">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Password berhasil direset</p>
            <p className="mt-1 text-ink-muted">{message}</p>
          </div>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setStatus('error');
      setMessage('Password baru minimal 8 karakter.');
      return;
    }

    if (password !== confirmation) {
      setStatus('error');
      setMessage('Konfirmasi password tidak cocok.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword: password })
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        setMessage(body.error ?? 'Password gagal direset. Coba minta tautan baru.');
        return;
      }

      setStatus('success');
      setMessage(body.data?.message ?? 'Silakan login dengan password baru Anda.');
    } catch {
      setStatus('error');
      setMessage('Tidak dapat menghubungi server. Coba lagi beberapa saat lagi.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new-password" className="text-sm font-semibold text-ink">
          Password baru
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-md border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="password-confirmation" className="text-sm font-semibold text-ink">
          Konfirmasi password
        </label>
        <input
          id="password-confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="mt-2 h-12 w-full rounded-md border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary"
        />
      </div>

      {status === 'error' && message ? (
        <p className="flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex min-h-12 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Menyimpan...' : 'Simpan password baru'}
      </button>
    </form>
  );
}
