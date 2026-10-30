'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  FlaskConical,
  HeartPulse,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  Stethoscope,
  X,
  type LucideIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavbarLinks } from './NavbarLink';
import { SearchModal } from './SearchModal';

const serviceMenuItems: {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    label: 'Klinik & rumah sakit',
    description: 'Bandingkan fasilitas dan jadwal layanan.',
    href: '/fasilitas',
    icon: Building2
  },
  {
    label: 'Laboratorium',
    description: 'Temukan pemeriksaan penunjang terdekat.',
    href: '/fasilitas?type=LABORATORY',
    icon: FlaskConical
  },
  {
    label: 'Konsultasi spesialis',
    description: 'Pilih bidang konsultasi sesuai kebutuhan.',
    href: '/#cari-layanan',
    icon: Stethoscope
  },
  {
    label: 'Layanan kesehatan lain',
    description: 'Cari layanan kesehatan di sekitar Anda.',
    href: '/fasilitas',
    icon: HeartPulse
  }
];

const ServiceMenuItems = () => (
  <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
    {serviceMenuItems.map((item) => {
      const Icon = item.icon;

      return (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-start gap-3 rounded-md px-3 py-3 hover:bg-primary-tint"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{item.label}</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted">
              {item.description}
            </span>
          </span>
        </Link>
      );
    })}
  </div>
);

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closeMobileMenu = () => {
    setMenuOpen(false);
    setMobileServicesOpen(false);
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
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="hidden h-[72px] items-center gap-4 lg:flex xl:gap-5">
            <Link href="/" aria-label="SILK beranda" className="flex shrink-0 items-center">
              <Image src="/assets/icon/icon.svg" alt="SILK" width={40} height={40} />
            </Link>

            <div className="relative shrink-0">
              <button
                type="button"
                popoverTarget="silk-services-menu"
                className="after:content-none flex h-12 items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-ink hover:bg-surface"
              >
                Layanan
                <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              </button>

              <div
                id="silk-services-menu"
                popover="auto"
                className="fixed inset-x-0 bottom-auto top-[72px] m-0 max-h-[calc(100vh-72px)] w-full max-w-none overflow-y-auto border-y border-border bg-white p-0"
              >
                <div className="container mx-auto max-w-7xl px-4 py-5">
                  <ServiceMenuItems />
                </div>
              </div>
            </div>

            <NavbarLinks />

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openSearch}
                className="hidden h-12 w-64 items-center gap-2 rounded-md border border-border-strong px-3 text-left text-sm text-ink-faint hover:border-primary hover:text-ink xl:flex xl:w-72"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Cari dokter, klinik, obat</span>
              </button>

              <button
                type="button"
                onClick={openSearch}
                className="flex h-12 w-12 items-center justify-center rounded-md border border-border-strong text-ink-muted hover:border-primary hover:text-primary-deep xl:hidden"
                aria-label="Cari layanan"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>

              <Link
                href="/#cari-layanan"
                className="hidden h-12 items-center gap-1.5 px-2 text-sm font-medium text-ink-muted hover:text-primary-deep xl:flex"
              >
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                Malang
              </Link>

              <Link
                href="/apotek"
                aria-label="Keranjang"
                className="flex h-12 w-12 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-primary-deep"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </Link>

              <button
                type="button"
                className="h-12 min-w-[72px] rounded-md border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-surface"
              >
                Masuk
              </button>
              <button
                type="button"
                className="h-12 min-w-[72px] rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Daftar
              </button>
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
                  {serviceMenuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-ink-muted hover:bg-primary-tint hover:text-primary-hover"
                      >
                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 border-t border-border pt-2">
                <NavbarLinks mobile onNavigate={closeMobileMenu} />
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="h-12 rounded-md border border-border-strong text-sm font-semibold text-ink hover:bg-surface"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="h-12 rounded-md bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Daftar
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
