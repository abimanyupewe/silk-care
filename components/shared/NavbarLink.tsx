
import Link from "next/link";

const navLinks = [
  { href: "/artikel", label: "Artikel" },
  { href: "/langganan", label: "Langganan" },
  { href: "/tentang", label: "Tentang Silk" },
];

export const NavbarLinks = () => {
  return (
    <div className="flex items-center gap-8">
      {navLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
};