'use client';

import { getSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        redirectTo: callbackUrl
      });

      if (!result?.ok) {
        setError('Email atau password salah.');
        return;
      }

      const session = await getSession();

      if (session?.user?.role !== 'ADMIN') {
        await signOut({ redirect: false });
        setError('Akun ini tidak memiliki akses ke panel admin.');
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError('Tidak dapat menghubungi server. Coba lagi beberapa saat lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          placeholder="admin@silk.local"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="text-sm font-semibold text-ink">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-12 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          placeholder="Masukkan password"
        />
      </div>

      {error ? (
        <p className="flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Memeriksa...' : 'Masuk ke panel admin'}
      </button>
    </form>
  );
}
