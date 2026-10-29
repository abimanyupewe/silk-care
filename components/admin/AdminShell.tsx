'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShoppingBag,
  Stethoscope,
  Users,
  X
} from 'lucide-react';
import { AdminStatsProvider, useAdminStats } from '@/components/admin/AdminStatsProvider';
import type { AdminStats } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  pending?: (moderation: AdminStats['moderation']) => number;
};

const navGroups: Array<{ label?: string; items: NavItem[] }> = [
  {
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }]
  },
  {
    label: 'Operasional',
    items: [
      { href: '/admin/users', label: 'Pengguna', icon: Users },
      { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag }
    ]
  },
  {
    label: 'Verifikasi & moderasi',
    items: [
      {
        href: '/admin/doctors',
        label: 'Dokter',
        icon: Stethoscope,
        pending: (moderation) => moderation.pendingDoctors
      },
      {
        href: '/admin/facilities',
        label: 'Fasilitas',
        icon: Building2,
        pending: (moderation) => moderation.pendingFacilities
      },
      {
        href: '/admin/reviews',
        label: 'Ulasan',
        icon: MessageSquareText,
        pending: (moderation) => moderation.pendingReviews
      },
      {
        href: '/admin/articles',
        label: 'Artikel',
        icon: FileText,
        pending: (moderation) => moderation.pendingArticles
      }
    ]
  },
  {
    label: 'Sistem',
    items: [
      { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
      { href: '/admin/audit-logs', label: 'Audit log', icon: ScrollText },
      { href: '/admin/email-templates', label: 'Template email', icon: Mail },
      { href: '/admin/system', label: 'Status sistem', icon: Activity }
    ]
  }
];

type AdminShellProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
  children: React.ReactNode;
};

const COLLAPSED_KEY = 'silk-admin-sidebar-collapsed';

function isActivePath(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell(props: AdminShellProps) {
  return (
    <AdminStatsProvider>
      <AdminShellContent {...props} />
    </AdminStatsProvider>
  );
}

function AdminShellContent({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { stats } = useAdminStats();
  // Angka antrean hanya pelengkap; sidebar tetap tampil tanpa angka.
  const moderation = stats?.moderation ?? null;
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeGroup = navGroups.find((group) =>
    group.items.some((item) => isActivePath(pathname, item.href))
  );
  const activeItem = activeGroup?.items.find((item) => isActivePath(pathname, item.href));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Dibaca setelah mount agar render server dan klien sama (tanpa hydration mismatch).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1');
    } catch {
      // Penyimpanan diblokir: sidebar tetap terbuka.
    }
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Hanya preferensi tampilan; aman diabaikan.
    }
  }

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const openButton = openButtonRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      openButton?.focus();
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-surface md:flex">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:min-h-11 focus:items-center focus:border focus:border-primary focus:bg-white focus:px-3 focus:text-sm focus:font-semibold focus:text-primary-hover"
      >
        Lewati ke konten
      </a>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[var(--scrim)] md:hidden"
        />
      ) : null}

      {/* Outline primary tidak terlihat di atas primary-deep, jadi fokus di sidebar memakai putih. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-primary-deep text-white transition-[transform,visibility] md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0 md:visible [&_:focus-visible]:outline-white',
          collapsed ? 'md:w-[72px]' : 'md:w-72',
          menuOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
        )}
      >
        <div
          className={cn(
            'flex min-h-16 items-center justify-between border-b border-primary-hover px-4',
            collapsed && 'md:justify-center md:px-0'
          )}
        >
          <Link
            href="/"
            title="Ke halaman utama SILK"
            className={cn('min-h-11 hover:text-white/90', collapsed && 'md:hidden')}
          >
            <span className="block font-display text-lg font-bold">SILK</span>
            <span className="block text-sm text-white/75">Panel admin</span>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Lebarkan sidebar' : 'Ciutkan sidebar'}
            title={collapsed ? 'Lebarkan sidebar' : 'Ciutkan sidebar'}
            className="hidden h-11 w-11 items-center justify-center hover:bg-primary-hover md:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center border border-white/40 hover:bg-primary-hover md:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3" aria-label="Navigasi admin">
          {navGroups.map((group) => (
            <div
              key={group.label ?? 'utama'}
              className={cn(
                'mb-4 last:mb-0',
                collapsed &&
                  'md:mb-2 md:border-t md:border-primary-hover md:pt-2 md:first:border-t-0 md:first:pt-0'
              )}
            >
              {group.label ? (
                <p
                  className={cn(
                    'px-4 pb-1 text-sm font-semibold text-white/75',
                    collapsed && 'md:hidden'
                  )}
                >
                  {group.label}
                </p>
              ) : null}
              <ul>
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  const pending = moderation && item.pending ? item.pending(moderation) : 0;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'relative flex min-h-11 items-center gap-3 border-l-4 pl-3 pr-4 text-sm',
                          collapsed && 'md:justify-center md:pl-0 md:pr-0',
                          active
                            ? 'border-amber bg-primary-tint font-semibold text-primary-hover'
                            : 'border-transparent font-medium text-white hover:bg-primary-hover'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className={cn('flex-1', collapsed && 'md:sr-only')}>
                          {item.label}
                        </span>
                        {pending > 0 ? (
                          <span
                            aria-label={`${pending} menunggu`}
                            className={cn(
                              'inline-flex min-w-6 items-center justify-center bg-amber px-1.5 text-sm font-semibold tabular-nums text-ink',
                              collapsed && 'md:absolute md:right-0 md:top-0 md:min-w-5 md:px-1'
                            )}
                          >
                            {pending > 99 ? '99+' : pending}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-primary-hover p-3">
          <div className={cn('px-3 py-2', collapsed && 'md:hidden')}>
            <p className="truncate text-sm font-semibold">{user.name || 'Admin SILK'}</p>
            <p className="truncate text-sm text-white/75">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: '/' })}
            title={collapsed ? 'Keluar' : undefined}
            className={cn(
              'mt-1 flex min-h-11 w-full items-center gap-3 px-3 text-sm font-medium hover:bg-primary-hover',
              collapsed && 'md:justify-center md:px-0'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className={cn(collapsed && 'md:sr-only')}>Keluar</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border bg-white px-4 md:px-8">
          <button
            ref={openButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border-strong md:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            {activeItem ? (
              <ol className="flex items-center gap-2 text-sm">
                {activeGroup?.label ? (
                  <li className="hidden items-center gap-2 text-ink-faint sm:flex">
                    {activeGroup.label}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </li>
                ) : null}
                <li className="truncate font-semibold text-ink">{activeItem.label}</li>
              </ol>
            ) : null}
          </nav>
        </header>

        <main id="admin-main" tabIndex={-1} className="px-4 py-6 outline-none md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
