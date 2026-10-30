'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronDown,
  Handshake,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  Stethoscope,
  X
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnnouncementBanner } from './AnnouncementBanner';
import { PartnerMenuPanel, ServiceMenuPanel, serviceMenuSections } from './MegaMenu';
import { NavbarLinks } from './NavbarLink';
import { PartnerMenuItems } from './PartnerMenu';
import { SearchModal } from './SearchModal';

// Menu desktop yang terbuka saat kursor di atasnya. Jeda tutup kecil karena ada celah antara
// tombol dan panel; sentuhan tidak memicu hover (pointerType), jadi layar sentuh tetap lewat klik.
const HoverMenu = ({ label, children }: { label: string; children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const show = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    cancelClose();
    setOpen(true);
  };
  const hideSoon = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="shrink-0"
      onPointerEnter={show}
      onPointerLeave={hideSoon}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-ink hover:text-primary-deep aria-expanded:text-primary-deep"
      >
        {label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          className="flex"
        >
          <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden="true" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }
            }}
            exit={{
              opacity: 0,
              y: -4,
              transition: { duration: reduceMotion ? 0 : 0.14, ease: 'easeIn' }
            }}
            onClick={() => setOpen(false)}
            className="absolute inset-x-0 top-full max-h-[calc(100vh-8rem)] overflow-y-auto border-b border-border bg-white"
          >
            <div className="container mx-auto max-w-7xl px-4 py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobilePartnerOpen, setMobilePartnerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closeMobileMenu = () => {
    setMenuOpen(false);
    setMobileServicesOpen(false);
    setMobilePartnerOpen(false);
  };

  const openSearch = () => {
    closeMobileMenu();
    setSearchOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <AnnouncementBanner />
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="hidden h-[72px] items-center gap-4 lg:flex xl:gap-5">
            <Link href="/" aria-label="SILK beranda" className="flex shrink-0 items-center">
              <Image src="/assets/icon/icon.svg" alt="SILK" width={40} height={40} />
            </Link>

            <HoverMenu label="Layanan">
              <ServiceMenuPanel />
            </HoverMenu>

            <HoverMenu label="Jadi mitra">
              <PartnerMenuPanel />
            </HoverMenu>

            <NavbarLinks />

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openSearch}
                className="hidden h-11 w-64 items-center gap-2 rounded-md border border-border-strong px-3 text-left text-sm text-ink-faint hover:border-primary hover:text-ink xl:flex xl:w-72"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Cari dokter, klinik, obat</span>
              </button>

              <button
                type="button"
                onClick={openSearch}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong text-ink-muted hover:border-primary hover:text-primary-deep xl:hidden"
                aria-label="Cari layanan"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>

              <Link
                href="/#cari-layanan"
                className="hidden h-11 items-center gap-1.5 px-2 text-sm font-medium text-ink-muted hover:text-primary-deep xl:flex"
              >
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                Malang
              </Link>

              <Link
                href="/apotek"
                aria-label="Keranjang"
                className="flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-primary-deep"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </Link>

              <Link
                href="/login"
                className="flex h-11 min-w-[64px] items-center justify-center rounded-md border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-surface"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="flex h-11 min-w-[64px] items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Daftar
              </Link>
            </div>
          </div>

          <div className="flex h-14 items-center lg:hidden">
            <Link href="/" aria-label="SILK beranda" className="flex items-center">
              <Image src="/assets/icon/icon.svg" alt="SILK" width={36} height={36} />
            </Link>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={openSearch}
                className="flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-primary-deep"
                aria-label="Cari layanan"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
              <Link
                href="/apotek"
                className="flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-primary-deep"
                aria-label="Keranjang"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-primary-deep"
                aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto border-t border-border bg-white lg:hidden">
            <div className="flex min-h-full flex-col px-4 pb-8 pt-4">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-ink hover:bg-surface"
                aria-expanded={mobileServicesOpen}
                onClick={() => setMobileServicesOpen((open) => !open)}
              >
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" aria-hidden="true" />
                  Layanan kesehatan
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-muted transition-transform ${
                    mobileServicesOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {mobileServicesOpen && (
                <div className="ml-3 border-l border-border pl-3">
                  {serviceMenuSections
                    .flatMap((section) => section.items)
                    .map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-ink-muted hover:bg-primary-tint hover:text-primary-hover"
                        >
                          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                          {item.title}
                        </Link>
                      );
                    })}
                </div>
              )}

              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-ink hover:bg-surface"
                aria-expanded={mobilePartnerOpen}
                onClick={() => setMobilePartnerOpen((open) => !open)}
              >
                <span className="flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
                  Jadi mitra
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-muted transition-transform ${
                    mobilePartnerOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {mobilePartnerOpen && (
                <div className="ml-3 border-l border-border pl-3">
                  <PartnerMenuItems onNavigate={closeMobileMenu} />
                </div>
              )}

              <div className="mt-2 border-t border-border pt-2">
                <NavbarLinks mobile onNavigate={closeMobileMenu} />
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex h-11 items-center justify-center rounded-md border border-border-strong text-sm font-semibold text-ink hover:bg-surface"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={closeMobileMenu}
                  className="flex h-11 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
