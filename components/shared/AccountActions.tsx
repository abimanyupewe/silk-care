'use client';

import Link from 'next/link';
import { getSession, signOut } from 'next-auth/react';
import useSWR from 'swr';
import { panelHomeForRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

const baseButton =
  'flex h-11 min-w-[64px] items-center justify-center rounded-md px-4 text-sm font-semibold';
const outlineButton = `${baseButton} border border-border-strong text-ink hover:border-primary hover:bg-surface`;
const primaryButton = `${baseButton} bg-primary text-white hover:bg-primary-hover`;

// Area akun di navbar: tamu melihat Masuk dan Daftar, pengguna yang sudah masuk melihat tombol
// panel (admin, dokter, fasilitas) dan Keluar. Sesi dibaca lewat getSession karena situs publik
// tidak memakai SessionProvider.
export function AccountActions({
  mobile = false,
  onNavigate
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { data: session, isLoading } = useSWR('silk-session', () => getSession());
  const wrapper = mobile ? 'flex gap-3 [&>*]:flex-1' : 'flex items-center gap-2';

  // Ruang dipertahankan selama sesi dimuat supaya tombol Masuk tidak berkedip lalu berganti.
  if (isLoading) {
    return <div aria-hidden="true" className={cn('h-11', !mobile && 'w-40')} />;
  }

  const user = session?.user;

  if (!user) {
    return (
      <div className={wrapper}>
        <Link href="/login" onClick={onNavigate} className={outlineButton}>
          Masuk
        </Link>
        <Link href="/daftar" onClick={onNavigate} className={primaryButton}>
          Daftar
        </Link>
      </div>
    );
  }

  // Pasien belum punya panel: panelHomeForRole mengembalikan '/'.
  const home = panelHomeForRole(user.role);

  return (
    <div className={wrapper}>
      {home !== '/' ? (
        <Link href={home} onClick={onNavigate} className={primaryButton}>
          Buka panel
        </Link>
      ) : null}
      <button type="button" onClick={() => signOut({ redirectTo: '/' })} className={outlineButton}>
        Keluar
      </button>
    </div>
  );
}
