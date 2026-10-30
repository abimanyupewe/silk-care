import Link from 'next/link';
import { ChevronRight, Handshake, Pill, Stethoscope, type LucideIcon } from 'lucide-react';
import { facilityTypeLabels, type FacilityTypeValue } from '@/lib/facility-types';
import { facilityTypeIcons } from './PartnerMenu';

type MenuLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

// Record penuh: menambah tipe fasilitas tanpa deskripsi akan gagal typecheck.
const facilityTypeDescriptions: Record<FacilityTypeValue, string> = {
  HOSPITAL: 'Layanan medis lengkap dan rawat inap.',
  CLINIC: 'Pemeriksaan umum dan konsultasi dokter.',
  LABORATORY: 'Pemeriksaan darah dan penunjang diagnosis.',
  PHARMACY: 'Obat dan perlengkapan kesehatan.',
  PHYSIOTHERAPY: 'Pemulihan gerak dan terapi fisik.',
  RADIOLOGY: 'Rontgen, USG, dan pencitraan lainnya.',
  FUNERAL_HOME: 'Layanan pemakaman dan rumah duka.',
  WELLNESS: 'Perawatan kebugaran dan relaksasi.',
  MASSAGE: 'Pijat kesehatan dan tradisional.',
  AMBULANCE: 'Transportasi pasien dan layanan darurat.'
};

const facilityLink = (type: FacilityTypeValue): MenuLink => ({
  title: facilityTypeLabels[type],
  description: facilityTypeDescriptions[type],
  href: `/fasilitas?type=${type}`,
  icon: facilityTypeIcons[type]
});

export const serviceMenuSections: { label: string; items: MenuLink[] }[] = [
  {
    label: 'Fasilitas medis',
    items: (['HOSPITAL', 'CLINIC', 'LABORATORY', 'RADIOLOGY', 'PHYSIOTHERAPY'] as const).map(
      facilityLink
    )
  },
  {
    label: 'Layanan lainnya',
    items: [
      {
        title: 'Dokter',
        description: 'Cari dokter dan lihat jadwal praktiknya.',
        href: '/doctor',
        icon: Stethoscope
      },
      {
        title: 'Apotek',
        description: facilityTypeDescriptions.PHARMACY,
        href: '/apotek',
        icon: Pill
      },
      ...(['AMBULANCE', 'WELLNESS', 'MASSAGE', 'FUNERAL_HOME'] as const).map(facilityLink)
    ]
  }
];

const MenuSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="px-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
    <ul className="mt-2 space-y-1">{children}</ul>
  </div>
);

const MenuItem = ({ item }: { item: MenuLink }) => {
  const Icon = item.icon;

  return (
    <li>
      <Link href={item.href} className="flex items-start gap-3 rounded-md p-3 hover:bg-surface">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-white text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{item.title}</span>
          <span className="mt-0.5 block text-sm leading-snug text-ink-muted">
            {item.description}
          </span>
        </span>
      </Link>
    </li>
  );
};

// Kartu di kanan menu: teks tetap untuk sekarang; bisa dihubungkan ke pengumuman admin nanti.
const PromoCard = ({
  title,
  body,
  highlight,
  ctaLabel,
  ctaHref
}: {
  title: string;
  body: string;
  highlight: string;
  ctaLabel: string;
  ctaHref: string;
}) => (
  <div className="flex flex-col rounded-md border border-border p-4">
    <p className="text-sm font-semibold text-ink">{title}</p>
    <p className="mt-1 text-sm text-ink-muted">{body}</p>
    <div className="mt-4 flex flex-1 flex-col justify-center rounded-md bg-primary-tint p-4">
      <Handshake className="h-5 w-5 text-primary" aria-hidden="true" />
      <p className="mt-3 text-base font-semibold leading-snug text-primary-deep">{highlight}</p>
    </div>
    <Link
      href={ctaHref}
      className="mt-4 flex h-11 items-center justify-center gap-1 rounded-md border border-border-strong text-sm font-semibold text-ink hover:border-primary hover:text-primary-deep"
    >
      {ctaLabel}
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </div>
);

const panelGrid = 'grid gap-6 lg:grid-cols-[1fr_1fr_20rem]';

export const ServiceMenuPanel = () => (
  <div className={panelGrid}>
    {serviceMenuSections.map((section) => (
      <MenuSection key={section.label} label={section.label}>
        {section.items.map((item) => (
          <MenuItem key={item.href} item={item} />
        ))}
      </MenuSection>
    ))}
    <PromoCard
      title="Punya fasilitas kesehatan?"
      body="Gabung sebagai mitra dan jangkau lebih banyak pasien."
      highlight="Daftarkan apotek, klinik, atau fasilitas Anda di SILK."
      ctaLabel="Daftar sekarang"
      ctaHref="/daftar"
    />
  </div>
);

export const PartnerMenuPanel = () => {
  const types = Object.keys(facilityTypeLabels) as FacilityTypeValue[];
  const half = Math.ceil(types.length / 2);

  return (
    <div className={panelGrid}>
      {[types.slice(0, half), types.slice(half)].map((group, index) => (
        <MenuSection key={index} label={index === 0 ? 'Fasilitas kesehatan' : 'Dan lainnya'}>
          {group.map((type) => (
            <MenuItem
              key={type}
              item={{ ...facilityLink(type), href: `/mitra/daftar?type=${type}` }}
            />
          ))}
        </MenuSection>
      ))}
      <div className="flex flex-col gap-4">
        <PromoCard
          title="Verifikasi oleh admin SILK"
          body="Profil Anda tampil di katalog publik setelah diverifikasi."
          highlight="Buat akun dan daftarkan fasilitas dalam satu langkah."
          ctaLabel="Mulai daftar"
          ctaHref="/mitra/daftar"
        />
        <div aria-disabled="true" className="flex items-start gap-3 rounded-md bg-surface p-3">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">Dokter</span> — segera hadir. Khusus dokter
            berizin, diverifikasi admin.
          </p>
        </div>
      </div>
    </div>
  );
};
