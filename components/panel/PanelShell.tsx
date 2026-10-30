'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PanelTour } from './PanelTour';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

type PanelShellProps = {
  navGroups: NavGroup[];
  brand: { name: string; subtitle: string };
  // Item dengan href ini hanya aktif pada path yang persis sama (beranda panel).
  rootHref: string;
  navLabel: string;
  storageKey: string;
  user: {
    name?: string | null;
    email?: string | null;
  };
  // Angka penanda per href (mis. antrean moderasi); opsional.
  badges?: Record<string, number>;
  children: React.ReactNode;
};

function isActivePath(pathname: string, href: string, rootHref: string) {
  return href === rootHref
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function PanelShell({
  navGroups,
  brand,
  rootHref,
  navLabel,
  storageKey,
  user,
  badges = {},
  children
}: PanelShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeGroup = navGroups.find((group) =>
    group.items.some((item) => isActivePath(pathname, item.href, rootHref))
  );
  const activeItem = activeGroup?.items.find((item) => isActivePath(pathname, item.href, rootHref));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Dibaca setelah mount agar render server dan klien sama (tanpa hydration mismatch).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(storageKey) === '1');
    } catch {
      // Penyimpanan diblokir: sidebar tetap terbuka.
    }
  }, [storageKey]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(storageKey, next ? '1' : '0');
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
        href="#panel-main"
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
            <span className="block font-display text-lg font-bold">{brand.name}</span>
            <span className="block text-sm text-white/75">{brand.subtitle}</span>
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

        <nav id="panel-nav" className="flex-1 overflow-y-auto py-3" aria-label={navLabel}>
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
                  const active = isActivePath(pathname, item.href, rootHref);
                  const Icon = item.icon;
                  const pending = badges[item.href] ?? 0;

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
            <p className="truncate text-sm font-semibold">{user.name || 'Pengguna SILK'}</p>
            <p className="truncate text-sm text-white/75">{user.email}</p>
          </div>
          <button
            id="panel-signout"
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
          <nav id="panel-breadcrumb" aria-label="Breadcrumb" className="min-w-0 flex-1">
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
          <PanelTour storageKey={storageKey} />
        </header>

        <main id="panel-main" tabIndex={-1} className="px-4 py-6 outline-none md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
