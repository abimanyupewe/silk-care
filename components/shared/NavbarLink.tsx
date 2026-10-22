'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/doctor', label: 'Dokter' },
  { href: '/apotek', label: 'Apotek' },
  { href: '/article', label: 'Artikel' }
];

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const NavbarLinks = ({
  mobile = false,
  onNavigate
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();

  return (
    <div
      className={
        mobile ? 'flex flex-col gap-1' : 'flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1'
      }
    >
      {navLinks.map((link) => {
        const active = isActive(pathname, link.href);

        return (
          <Link
            key={link.label}
            href={link.href}
            className={
              mobile
                ? `flex items-center rounded-md px-3 py-3 text-sm font-semibold ${
                    active
                      ? 'bg-primary-tint text-primary-deep'
                      : 'text-ink-muted hover:bg-surface hover:text-primary-hover'
                  }`
                : `relative flex h-[72px] items-center whitespace-nowrap px-3 text-sm font-semibold ${
                    active
                      ? 'text-primary-deep after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                      : 'text-ink-muted hover:text-primary-deep'
                  }`
            }
            onClick={onNavigate}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
};
