import Link from 'next/link';

const FooterLinkColumn = ({
  title,
  links
}: {
  title: string;
  links: { href: string; label: string }[];
}) => (
  <div>
    <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="text-sm text-white/80 underline-offset-4 hover:text-white hover:underline"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  const silkLinks = [
    { href: '/article', label: 'Artikel kesehatan' },
    { href: '/doctor', label: 'Dokter' },
    { href: '/apotek', label: 'Apotek' },
    { href: '#tentang', label: 'Tentang SILK' }
  ];
  const collaborationLinks = [
    { href: '#mitra', label: 'Daftar sebagai dokter' },
    { href: '#mitra', label: 'Daftar sebagai klinik' },
    { href: '#mitra', label: 'Daftar sebagai apotek' }
  ];

  return (
    <footer className="bg-primary-deep text-white">
      <div className="container mx-auto max-w-[1200px] px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="text-2xl font-bold">SILK</h2>
            <p className="mt-3 max-w-xs text-sm text-white/80">
              Sistem Informasi Layanan Kesehatan untuk masyarakat Malang dan sekitarnya.
            </p>
            <form className="mt-6 flex rounded-lg border border-white/50 bg-white p-1">
              <label className="sr-only" htmlFor="newsletter-email">
                Email Anda
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email Anda"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-md bg-amber px-4 text-sm font-semibold text-ink hover:bg-[#e69900]"
              >
                Kirim
              </button>
            </form>
          </div>
          <FooterLinkColumn title="SILK" links={silkLinks} />
          <FooterLinkColumn title="Kolaborasi" links={collaborationLinks} />
          <div>
            <h3 className="mb-4 text-lg font-bold">Hubungi kami</h3>
            <div className="space-y-3 text-sm text-white/80">
              <p>Malang, Jawa Timur</p>
              <p>info@silkhealth.id</p>
              <p>(0341) 1234-5678</p>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/30 pt-6 text-sm text-white/70">
          <p>© 2026 SILK. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
};
