'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, MapPin, Menu, Search, X } from 'lucide-react';
import { NavbarLinks } from './NavbarLink';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { useState } from 'react';

export const Navbar = () => {
  const [location, setLocation] = useState('Malang');
  const [service, setService] = useState('Layanan Kesehatan');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="container mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 lg:h-[72px]">
        <Link href="/" aria-label="SILK beranda" className="shrink-0">
          <Image src="/assets/icon/icon.svg" alt="SILK" width={40} height={40} />
        </Link>

        <div className="hidden flex-1 items-center gap-6 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-12 items-center gap-2 text-left text-sm font-semibold">
                {service}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onSelect={() => setService('Layanan Kesehatan')}>
                Layanan Kesehatan
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setService('Psikologi')}>
                Psikologi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex h-12 min-w-0 flex-1 items-center rounded-lg border border-border-strong bg-white px-3">
            <Search className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              placeholder="Cari rumah sakit, klinik, dokter"
              aria-label="Cari layanan kesehatan"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="mx-3 h-6 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex min-w-28 items-center gap-2 text-left text-sm font-semibold">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate">{location}</span>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {['Malang', 'Surabaya', 'Jakarta', 'Bandung'].map((item) => (
                  <DropdownMenuItem key={item} onSelect={() => setLocation(item)}>
                    {item}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <NavbarLinks />
        </div>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <button className="h-12 rounded-md border border-border-strong px-5 text-sm font-semibold hover:border-border-strong hover:bg-surface">
            Masuk
          </button>
          <button className="h-12 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            Daftar
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md"
            aria-label="Cari"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-white px-4 py-4 lg:hidden">
          <NavbarLinks />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="h-12 rounded-md border border-border-strong text-sm font-semibold hover:border-border-strong">
              Masuk
            </button>
            <button className="h-12 rounded-md bg-primary text-sm font-semibold text-white">
              Daftar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
