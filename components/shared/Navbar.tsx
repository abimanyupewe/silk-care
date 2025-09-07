"use client";

import Image from 'next/image';
import { ChevronDown, MapPin, Search } from 'lucide-react';
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

  return (
    <nav className="w-full">
      <div className="container max-w-7xl mx-auto">
        <div className="flex justify-end pt-2">
          <NavbarLinks />
        </div>

        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-6">
            <Image src="/assets/icon/icon.svg" alt="SILK Logo" width={50} height={50} />
            <button className="flex items-center gap-2 font-medium text-gray-700">
              Layanan kesehatan
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border p-1">
            <div className="flex items-center gap-2 p-2">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari rumah sakit terdekat dan lainnya"
                className="w-64 outline-none text-sm"
              />
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 w-48 text-left outline-none">
                  <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{location}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onSelect={() => setLocation('Malang')}>Malang</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation('Surabaya')}>
                  Surabaya
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation('Jakarta')}>Jakarta</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation('Bandung')}>Bandung</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-6 py-2 text-sm font-semibold rounded-lg border border-[#00A991] text-[#00A991] hover:bg-teal-50 transition">
              Masuk
            </button>
            <button className="px-6 py-2 text-sm font-semibold text-white bg-[#00A991] rounded-lg hover:bg-opacity-90 transition">
              Daftar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
