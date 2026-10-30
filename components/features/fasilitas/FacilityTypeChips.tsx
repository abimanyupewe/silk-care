import Link from 'next/link';
import { Check } from 'lucide-react';
import { facilityTypeLabels, facilityTypes, type FacilityTypeValue } from '@/lib/facility-types';
import { cn } from '@/lib/utils';

// Tautan, bukan state: filter ada di URL (?type=) sehingga bisa dibagikan dan tombol kembali bekerja.
export function FacilityTypeChips({ active }: { active?: FacilityTypeValue }) {
  const items = [
    { href: '/fasilitas', label: 'Semua', selected: !active },
    ...facilityTypes.map((value) => ({
      href: `/fasilitas?type=${value}`,
      label: facilityTypeLabels[value],
      selected: active === value
    }))
  ];

  return (
    <nav aria-label="Filter jenis fasilitas">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.selected ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 border px-4 text-sm font-semibold',
                item.selected
                  ? 'border-primary bg-primary-tint text-primary-hover'
                  : 'border-border-strong bg-white text-ink hover:border-primary'
              )}
            >
              {item.selected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
