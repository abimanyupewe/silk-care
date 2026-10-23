import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';
import { VerifyEmailStatus } from './verify-email-status';

export const metadata: Metadata = {
  title: 'Verifikasi email — SILK',
  description: 'Konfirmasi alamat email akun SILK Anda.'
};

export default function VerifyEmailPage() {
  return (
    <div>
      <Navbar />

      <main className="mx-auto w-full max-w-xl px-4 py-12 md:py-16">
        <p className="text-sm font-semibold text-primary-hover">Verifikasi email</p>
        <h1 className="mt-2 text-2xl font-bold text-ink md:text-[32px]">Konfirmasi alamat email</h1>
        <p className="mt-2 text-ink-muted">
          Kami sedang memeriksa tautan verifikasi Anda. Jangan tutup halaman ini.
        </p>

        <div className="mt-6 border border-border bg-surface p-6">
          <Suspense fallback={<p className="text-ink-muted">Memeriksa token verifikasi...</p>}>
            <VerifyEmailStatus />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
