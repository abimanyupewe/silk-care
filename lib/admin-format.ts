export const adminDayLabels: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu'
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export function formatAdminCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return currencyFormatter.format(value);
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('id-ID', {
    dateStyle: 'medium'
  });
}

export function formatAdminDateTime(value: string | null | undefined) {
  if (!value) return '—';

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export function formatAdminRating(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('id-ID')} / 5`;
}

export function formatAdminPriceRange(min: number | null | undefined, max?: number | null) {
  if (min === null || min === undefined) return '—';
  return max
    ? `${formatAdminCurrency(min)} – ${formatAdminCurrency(max)}`
    : formatAdminCurrency(min);
}
