import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { safeCallbackUrl } from '@/lib/roles';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Masuk — SILK',
  description: 'Masuk ke akun SILK.'
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getActiveSession();
  const { callbackUrl } = await searchParams;

  if (session) {
    redirect(safeCallbackUrl(callbackUrl, session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Masuk ke akun Anda</h1>
        <p className="mt-2 text-ink-muted">
          Admin, dokter, dan fasilitas masuk di sini dan diarahkan ke panel masing-masing.
        </p>

        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl ?? ''} />
        </div>
      </div>
    </main>
  );
}
