'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  ScrollText,
  ShoppingBag,
  Stethoscope,
  Users,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Ringkasan',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }]
  },
  {
    label: 'Manajemen',
    items: [
      { href: '/admin/users', label: 'Pengguna', icon: Users },
      { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag }
    ]
  },
  {
    label: 'Verifikasi',
    items: [
      { href: '/admin/doctors', label: 'Dokter', icon: Stethoscope },
      { href: '/admin/facilities', label: 'Fasilitas', icon: Building2 }
    ]
  },
  {
    label: 'Moderasi',
    items: [
      { href: '/admin/reviews', label: 'Ulasan', icon: MessageSquareText },
      { href: '/admin/articles', label: 'Artikel', icon: FileText }
    ]
  },
  {
    label: 'Komunikasi',
    items: [{ href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone }]
  },
  {
    label: 'Keamanan',
    items: [{ href: '/admin/audit-logs', label: 'Audit log', icon: ScrollText }]
  }
];

type AdminShellProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
  children: React.ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface md:flex">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[var(--scrim)] md:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-white transition-transform md:static md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex min-h-16 items-center justify-between border-b border-border px-4">
          <div>
            <p className="font-display text-lg font-bold text-ink">SILK Admin</p>
            <p className="text-xs text-ink-faint">Panel operasional</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border-strong md:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Navigasi admin">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium',
                          active
                            ? 'border-primary bg-primary-tint text-primary-hover'
                            : 'text-ink-muted hover:border-border hover:bg-surface hover:text-ink'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-md bg-surface px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{user.name || 'Admin SILK'}</p>
            <p className="truncate text-xs text-ink-faint">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: '/' })}
            className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-ink-muted hover:bg-surface hover:text-ink"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border bg-white px-4 md:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border-strong md:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.name || 'Admin SILK'}</p>
            <p className="truncate text-xs text-ink-faint">{user.email}</p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 text-sm font-medium text-ink hover:border-primary hover:bg-primary-tint"
          >
            Lihat situs
          </Link>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
