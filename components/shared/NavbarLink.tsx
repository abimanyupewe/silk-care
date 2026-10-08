import Link from 'next/link';

const navLinks = [
  { href: '/artikel', label: 'Artikel' },
  { href: '/langganan', label: 'Langganan' },
  { href: '/tentang', label: 'Tentang Silk' }
];

export const NavbarLinks = () => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
      {navLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="text-sm font-semibold text-muted-foreground hover:text-primary-hover"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
};
