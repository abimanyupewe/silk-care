'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const started = useRef(false);
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? '' : 'Token verifikasi tidak ditemukan pada tautan.'
  );

  useEffect(() => {
    if (!token || started.current) {
      return;
    }

    started.current = true;

    fetch('/api/v1/auth/verify-email/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          setStatus('error');
          setMessage(body.error ?? 'Token verifikasi tidak valid atau sudah kedaluwarsa.');
          return;
        }

        setStatus('success');
        setMessage(body.data?.message ?? 'Email berhasil diverifikasi.');
      })
      .catch(() => {
        setStatus('error');
        setMessage('Tidak dapat menghubungi server. Coba lagi beberapa saat lagi.');
      });
  }, [token]);

  return (
    <div aria-live="polite">
      {status === 'loading' ? (
        <div className="flex items-start gap-3">
          <Loader2
            className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-ink-muted">Memeriksa token verifikasi...</p>
        </div>
      ) : status === 'success' ? (
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Email berhasil diverifikasi</p>
            <p className="mt-1 text-ink-muted">{message}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Verifikasi gagal</p>
            <p className="mt-1 text-ink-muted">{message}</p>
          </div>
        </div>
      )}

      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
