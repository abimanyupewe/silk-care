import { MapPin, Phone, Star } from 'lucide-react';
import { SmartImage } from './SmartImage';

export type PublicPartnerDetailProps = {
  name: string;
  label: string;
  description?: string | null;
  specialty?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  rating?: number | null;
  reviewCount: number;
  fee?: number | null;
  schedule: Array<{ day: number; start: string; end: string; closed?: boolean }>;
  services?: Array<{
    name: string;
    description: string | null;
    priceMin: number | null;
    priceMax: number | null;
  }>;
};

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const rupiah = new Intl.NumberFormat('id-ID');

function formatPrice(min: number | null, max: number | null) {
  if (min === null && max === null) return null;
  if (min === max || max === null) return `Rp ${rupiah.format(min ?? 0)}`;
  return `Rp ${rupiah.format(min ?? 0)}–${rupiah.format(max)}`;
}

export function PublicPartnerDetail({
  name,
  label,
  description,
  specialty,
  address,
  city,
  phone,
  photoUrl,
  rating,
  reviewCount,
  fee,
  schedule,
  services = []
}: PublicPartnerDetailProps) {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex gap-4 border-b border-border pb-6">
            {photoUrl ? (
              <SmartImage
                src={photoUrl}
                alt={name}
                width={96}
                height={96}
                className="h-24 w-24 border border-border object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-border bg-surface text-sm text-ink-muted">
                Foto
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary-hover">{label}</p>
              <h1 className="mt-1 text-3xl font-bold text-ink">{name}</h1>
              {specialty ? <p className="mt-1 text-ink-muted">{specialty}</p> : null}
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                <Star className="h-4 w-4 text-amber-ink" aria-hidden="true" />
                {rating == null
                  ? 'Belum ada rating'
                  : `${rating.toFixed(1)} · ${reviewCount} ulasan`}
              </p>
            </div>
          </div>
          {description ? (
            <p className="mt-6 whitespace-pre-line leading-7 text-ink-muted">{description}</p>
          ) : null}
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-xl font-bold text-ink">Lokasi dan kontak</h2>
            <p className="mt-3 flex gap-2 text-ink-muted">
              <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              {[address, city].filter(Boolean).join(', ') || 'Alamat belum tersedia'}
            </p>
            {phone ? (
              <p className="mt-3 flex gap-2 text-ink-muted">
                <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                {phone}
              </p>
            ) : null}
          </div>
          {services.length > 0 ? (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-xl font-bold text-ink">Layanan</h2>
              <ul className="mt-4 divide-y divide-border border border-border">
                {services.map((service) => (
                  <li key={service.name} className="p-4">
                    <p className="font-semibold text-ink">{service.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">{service.description}</p>
                    {formatPrice(service.priceMin, service.priceMax) ? (
                      <p className="mt-2 text-sm font-semibold text-primary-hover">
                        {formatPrice(service.priceMin, service.priceMax)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
        <aside className="h-fit border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-ink">Jadwal</h2>
          <ul className="mt-4 divide-y divide-border">
            {days.map((day, index) => {
              const item = schedule.find((entry) => entry.day === index + 1);
              return (
                <li key={day} className="flex justify-between gap-4 py-2 text-sm">
                  <span className="text-ink-muted">{day}</span>
                  <span className="text-right font-medium text-ink">
                    {item?.closed ? 'Tutup' : item ? `${item.start}–${item.end}` : 'Belum diatur'}
                  </span>
                </li>
              );
            })}
          </ul>
          {fee != null ? (
            <p className="mt-5 border-t border-border pt-4 text-sm text-ink-muted">
              Biaya konsultasi{' '}
              <span className="block text-lg font-bold text-primary-hover">
                Rp {rupiah.format(fee)}
              </span>
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
