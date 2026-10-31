// Pemformat tampilan untuk situs publik. Murni (tanpa import server), aman dipakai di server maupun klien.
const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

const longDate = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'Asia/Jakarta'
});

export function formatRupiah(value: number) {
  return rupiah.format(value);
}

export function formatLongDate(iso: string) {
  return longDate.format(new Date(iso));
}

// Rating dengan koma desimal (4,9), sesuai penulisan Indonesia.
export function formatRatingId(value: number) {
  return value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
