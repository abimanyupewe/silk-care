import Link from 'next/link';
import {
  collaborationLinks,
  contact,
  exploreLinks,
  legalLinks,
  type FooterLink
} from './footer-links';

const linkClass =
  'inline-flex min-h-11 items-center text-sm text-white/80 underline-offset-4 hover:text-white hover:underline';

const FooterLinkColumn = ({
  title,
  links,
  note
}: {
  title: string;
  links: FooterLink[];
  note?: string;
}) => (
  <nav aria-label={title}>
    <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={linkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
    {note ? <p className="mt-1 text-sm text-white/70">{note}</p> : null}
  </nav>
);

// Nomor telepon dinormalkan hanya untuk tautan tel:; teks yang tampil tetap apa adanya.
const telHref = `tel:${contact.phone.replace(/[^\d+]/g, '')}`;

export const Footer = () => (
  <footer className="bg-primary-deep text-white">
    <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-2xl font-bold">SILK</h2>
          <p className="mt-3 max-w-xs text-sm text-white/80">
            Sistem Informasi Layanan Kesehatan untuk masyarakat Malang dan sekitarnya.
          </p>
          <Link
            href="/daftar"
            className="mt-6 inline-flex h-11 items-center rounded-md border border-white/50 px-4 text-sm font-semibold text-white hover:bg-white/10"
          >
            Daftar sebagai mitra
          </Link>
        </div>

        <FooterLinkColumn title="Jelajahi" links={exploreLinks} />
        <FooterLinkColumn title="Kolaborasi" links={collaborationLinks} />

        <div>
          <h3 className="mb-2 text-lg font-bold">Hubungi kami</h3>
          <address className="space-y-1 not-italic">
            <p className="flex min-h-11 items-center text-sm text-white/80">{contact.address}</p>
            <p>
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
            </p>
            <p>
              <a href={telHref} className={linkClass}>
                {contact.phone}
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-white/30 pt-4 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        <p>© 2026 SILK. Seluruh hak cipta dilindungi.</p>
        <ul className="flex flex-wrap gap-x-6">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </footer>
);
