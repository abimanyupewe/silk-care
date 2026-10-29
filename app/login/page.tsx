import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Masuk admin — SILK',
  description: 'Masuk ke panel admin SILK.'
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getActiveSession();

  if (session?.user.role === 'ADMIN') {
    redirect('/admin');
  }

  const { callbackUrl } = await searchParams;
  const target = callbackUrl?.startsWith('/admin') ? callbackUrl : '/admin';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">Panel admin</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Masuk ke SILK</h1>
        <p className="mt-2 text-ink-muted">
          Gunakan akun admin untuk mengelola pengguna, partner, konten, dan pesanan.
        </p>

        <div className="mt-6">
          <LoginForm callbackUrl={target} />
        </div>
      </div>
    </main>
  );
}
