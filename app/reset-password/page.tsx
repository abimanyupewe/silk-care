import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset password — SILK',
  description: 'Atur ulang password akun SILK Anda.'
};

export default function ResetPasswordPage() {
  return (
    <div>
      <Navbar />

      <main className="mx-auto w-full max-w-xl px-4 py-12 md:py-16">
        <p className="text-sm font-semibold text-primary-hover">Reset password</p>
        <h1 className="mt-2 text-2xl font-bold text-ink md:text-[32px]">Buat password baru</h1>
        <p className="mt-2 text-ink-muted">
          Masukkan password baru untuk akun SILK Anda. Minimal 8 karakter.
        </p>

        <div className="mt-6 border border-border bg-surface p-6">
          <Suspense fallback={<p className="text-ink-muted">Memuat formulir...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
