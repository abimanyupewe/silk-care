# Ringkasan Perubahan UI — SILK

Dokumen ini merangkum arah desain dan perubahan UI yang direncanakan untuk SILK.
Status: **sebagian diimplementasikan** — tipografi, navbar, dan modal pencarian
sudah diterapkan. Layout section beranda dan keputusan radius masih berupa rencana.

Referensi:

- `DESIGN-silk.json` — design brief, token, dan aturan visual.
- `dev/SRS SILK.md` — kebutuhan produk dan integrasi yang direncanakan.
- `app/globals.css` — token warna, font, dan gaya dasar yang berlaku saat ini.

---

## 1. Arah visual

**Clinical editorial minimal** — bersih, tenang, banyak ruang kosong, dan tidak
ramai seperti marketplace kesehatan pada umumnya.

| Elemen          | Keputusan                                                           |
| --------------- | ------------------------------------------------------------------- |
| Latar           | Putih `#FFFFFF` dan surface `#F3F7F6` bergantian per section        |
| Warna utama     | Teal `primary` untuk aksi dan tautan                                |
| Teal gelap      | `primary-deep` hanya untuk search band, hero (opsional), dan footer |
| Aksen           | Amber hanya untuk promo, rating, dan CTA di atas latar gelap        |
| Teks            | `ink` untuk judul, `ink-muted` untuk deskripsi, minimal 14px        |
| Pemisah         | Border 1px, bukan shadow                                            |
| Container       | 1200–1280px, padding 16px mobile / 24px desktop                     |
| Spacing section | 64–96px desktop, 48px mobile                                        |

Prinsip yang dipertahankan:

- Satu tombol primary per area.
- Status, verifikasi, dan promo selalu memakai ikon + label, bukan warna saja.
- Harga memakai format Indonesia dan `tabular-nums`.
- Tidak ada gradien, glass effect, atau shadow.

---

## 2. Tipografi

Keputusan: **Satoshi untuk heading, Inter untuk body/UI**.

Satoshi tidak tersedia di Google Fonts. File Satoshi sudah ada di
`public/assets/fonts`, jadi tidak perlu diunduh ulang. Inter diambil dari Google
Fonts melalui `next/font/google`.

| Peran         | Font    | Ukuran  | Weight  |
| ------------- | ------- | ------- | ------- |
| Hero          | Satoshi | 40–48px | 700     |
| Judul section | Satoshi | 28px    | 700     |
| Judul kartu   | Satoshi | 18px    | 600     |
| Body          | Inter   | 16px    | 400     |
| Meta / label  | Inter   | 14px    | 400–500 |
| Tombol        | Inter   | 14–15px | 600     |
| Harga         | Satoshi | 20px    | 700     |

Aturan:

- Heading memakai `letter-spacing: -0.02em`; body `0`.
- Body line-height 1.55–1.6, maksimal ±68 karakter per baris.
- Harga dan angka statistik memakai `font-variant-numeric: tabular-nums`.
- Hanya gunakan weight 400, 500, 600, dan 700.

### Implementasi font

`app/layout.tsx`:

```tsx
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';

const satoshi = localFont({
  src: '../public/assets/fonts/Satoshi-Variable.woff2',
  weight: '300 900',
  style: 'normal',
  variable: '--font-satoshi',
  display: 'swap'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

// <html lang="id" className={`${satoshi.variable} ${inter.variable}`}>
```

`app/globals.css`:

```css
:root {
  --font-body: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
}
```

Lalu:

- Hapus seluruh blok `@font-face` Satoshi yang lama.
- Pindahkan `font-family` dari selector `*` ke `body`.
- `h1`–`h6` tetap memakai `--font-heading`.
- Jangan memakai `@import` Google Fonts di CSS; gunakan `next/font`.
- `next/font/google` membutuhkan internet saat build pertama, setelah itu font
  disajikan dari domain sendiri.

---

## 3. Navbar

Perubahan utama: **tidak ada input search inline**. Search berupa tombol yang
membuka modal.

### Desktop

```text
[logo] SILK   Layanan ▾   Dokter   Apotek   Artikel   [ 🔍 Cari ]   📍 Malang   🛒   Masuk   [Daftar]
```

### Mobile

```text
[logo] SILK                         🔍   🛒   ☰
```

| Bagian         | Spesifikasi                                                        |
| -------------- | ------------------------------------------------------------------ |
| Tinggi         | 72px desktop, 56px mobile                                          |
| Latar          | Putih solid, border-bottom 1px `border`                            |
| Posisi         | `sticky top-0`, z-index tinggi, tanpa shadow                       |
| Logo           | Ikon saja, 40px desktop dan 36px mobile                            |
| Menu           | 14px semibold, `ink-muted`; aktif `primary-deep` + garis bawah 2px |
| Trigger search | Field palsu 256–288×48px di desktop; ikon 44×44px di mobile        |
| Tombol         | 48px desktop, 44px mobile                                          |
| Aksi           | "Masuk" secondary outline, "Daftar" primary                        |
| Target sentuh  | Minimal 44×44px                                                    |

### Struktur menu

Hindari duplikasi menu saat ini, di mana "Layanan" berisi Apotek dan Dokter,
tetapi keduanya juga menjadi menu terpisah.

Rekomendasi:

- **Layanan ▾** — Klinik & rumah sakit, Laboratorium, Konsultasi spesialis,
  Layanan lainnya.
- **Dokter**
- **Apotek**
- **Artikel**
- "Tentang SILK" cukup di footer.

### Dropdown "Layanan"

- Panel selebar container, menempel di bawah header.
- Latar putih, border 1px, tanpa shadow.
- Grid 4 kolom: ikon 20px, judul 14px semibold, deskripsi satu baris.
- Hover item memakai `bg-primary-tint`.
- Tutup dengan Esc, klik luar, atau perpindahan fokus.
- Gunakan `@radix-ui/react-dropdown-menu` atau implementasi `popover` yang
  memiliki CSS eksplisit.

### Perubahan yang sudah diterapkan

- Class `megamenu` dihapus. Dropdown sekarang memakai panel `fixed` selebar
  viewport yang menempel di bawah header.
- Menu utama menjadi Dokter, Apotek, dan Artikel. "Tentang SILK" tetap di footer.
- State aktif memakai `usePathname`, ditandai warna dan garis bawah 2px.
- Logo memakai ikon saja tanpa wordmark; ukuran 40px desktop dan 36px mobile.
- Tombol "Masuk" memakai gaya secondary outline, "Daftar" tetap primary.
- Tombol dan search trigger desktop memakai tinggi 48px; ikon mobile 44×44px.
- Search inline diganti trigger modal: field palsu di desktop, ikon di mobile.
- Menu mobile menjadi panel penuh di bawah header dengan scroll body terkunci.
- Radius navbar masih `rounded-md`; keputusan radius global belum diambil.

---

## 4. Search modal

Search global direkomendasikan mencakup dokter, layanan, apotek/produk, dan
artikel.

### Desktop

```text
┌──────────────────────────────────────────────┐
│ 🔍  Cari dokter, klinik, atau obat...      ✕ │
├──────────────────────────────────────────────┤
│ Pencarian populer                            │
│ [Dokter gigi] [Apotek terdekat] [Konsultasi] │
│                                              │
│ Dokter                                       │
│  dr. Santika Dewi — Spesialis anak           │
│  dr. Clara Anindita — Dokter umum            │
│                                              │
│ Apotek                                       │
│  Vitamin harian untuk keluarga — Aposilk     │
│                                              │
│ Lihat semua hasil untuk "anak" →             │
├──────────────────────────────────────────────┤
│ ↑↓ pilih   Enter buka   Esc tutup            │
└──────────────────────────────────────────────┘
```

| Bagian       | Spesifikasi                                                    |
| ------------ | -------------------------------------------------------------- |
| Ukuran       | 640–720px, tinggi maksimal 70vh                                |
| Posisi       | Center, 12–15vh dari atas                                      |
| Scrim        | `rgba(17,17,20,0.45)`                                          |
| Panel        | Putih, border 1px `border-strong`, tanpa shadow                |
| Input        | Tinggi 56px, teks 18px, border-bottom 1px                      |
| Tombol tutup | 44×44px                                                        |
| Baris hasil  | Minimal 56px, ikon 20px, hover `surface`, aktif `primary-tint` |
| Scroll       | Hanya area hasil; input tetap terlihat                         |
| Footer       | Petunjuk keyboard 14px `ink-muted`                             |

### Mobile

- Full-screen, bukan kotak kecil.
- Header: tombol kembali/tutup + input autofocus.
- Filter cepat: **Semua | Dokter | Apotek | Artikel**.
- Hasil memenuhi sisa layar dan aman dari keyboard.
- CTA "Lihat semua hasil" menempel di bawah.

### Perilaku

- Modal terbuka, input langsung fokus.
- Minimal 2 karakter, debounce ±250ms.
- Hasil dikelompokkan per kategori, maksimal 4–5 item per grup.
- Panah atas/bawah untuk memilih, Enter membuka, Esc menutup.
- Klik luar modal menutup.
- Setelah navigasi, modal tertutup dan fokus kembali ke trigger.
- Body scroll dikunci selama modal terbuka.
- Saat kosong, tampilkan pencarian populer.
- Tanpa hasil: satu kalimat + saran kata kunci.

### Aksesibilitas

- `role="dialog"`, `aria-modal="true"`, dan label input.
- Focus trap dan pengembalian fokus ke trigger.
- `aria-expanded` pada trigger.
- Navigasi keyboard penuh.

### Implementasi

- `components/shared/SearchModal.tsx` sudah dibuat memakai native `<dialog>` +
  `showModal()`. Esc, focus trap, dan pengembalian fokus ditangani browser.
- Klik di luar panel ditangani manual lewat event klik pada elemen `<dialog>`.
- Modal mengunci scroll body selama terbuka.
- Route `/search` sudah dibuat sebagai server component dan meng-`await`
  `searchParams` sesuai Next 15.
- Halaman hasil memakai form GET dan dapat dibuka langsung lewat
  `/search?q=kata-kunci`.
- Alternatif `@radix-ui/react-dialog` belum diperlukan.

### Sumber data pencarian

Data masih statis, tetapi sekarang terpusat di `lib/search-index.ts`:

```ts
type SearchItem = {
  type: 'doctor' | 'service' | 'product' | 'article';
  title: string;
  subtitle: string;
  href: string;
  keywords?: string[];
};
```

Pencarian dilakukan di client atas data statis. Nanti sumber ini dapat diganti
dengan API Strapi tanpa mengubah komponen modal.

---

## 5. Layout section beranda

| Section              | Layout                                                            | Latar          |
| -------------------- | ----------------------------------------------------------------- | -------------- |
| Hero                 | Header ringkas + grid 6 layanan langsung terlihat; tanpa carousel | Putih          |
| Konsultasi spesialis | Grid 3 kolom, kartu 72px                                          | Putih          |
| Dokter pilihan       | Grid 3 kolom, foto 72px, maksimal 2 badge                         | Putih          |
| Promo                | Banner 16:9, bingkai border, label "Dipromosikan"                 | Putih          |
| Search band          | Blok penuh teal, form putih satu baris                            | `primary-deep` |
| Marketplace          | Chip horizontal + grid 5 kolom desktop / 2 mobile                 | Surface        |
| Ulasan               | Grid 3 kartu, bintang amber + angka                               | Surface        |
| Artikel              | Grid 3 kolom, gambar 16:9                                         | Putih          |
| Footer               | Teal gelap, teks putih                                            | `primary-deep` |

Pola section header:

- Judul di kiri, satu baris deskripsi di bawahnya.
- Tautan "Lihat semua" di kanan.
- Satu tombol primary per section.
- Gantian putih → surface untuk memberi jeda visual.

Catatan: hero kini menyerap daftar layanan (Dokter, Apotek, Klinik & rumah sakit,
Laboratorium, Ahli gizi & katering, Artikel), sehingga section `Service` lama
dihapus. Carousel dan foto hero juga dihapus; pencarian tetap satu di navbar.

---

## 6. Radius dan shadow

Design brief meminta **radius 0** dan **tanpa shadow**. Implementasi saat ini
masih memakai campuran `rounded-md`, `rounded-lg`, `rounded-xl`, dan
`rounded-full`, sementara `app/globals.css` memetakan radius 6–20px.

Keputusan yang perlu diambil:

1. **Sharp (rekomendasi)** — radius 0, border 1px, paling sesuai brief.
2. **Soft** — radius 8–12px, lebih ramah, tetapi harus konsisten.

Apa pun pilihannya:

- Shadow sudah dipaksa `none` di `globals.css`.
- Hapus `shadow*` yang tersisa di `components/ui/button.tsx` agar tidak menjadi
  preseden.
- Avatar saat ini `rounded-full`; brief meminta persegi. Perlu diputuskan.

---

## 7. Checklist implementasi

- [x] `app/layout.tsx`: pasang Satoshi (`next/font/local`) dan Inter
      (`next/font/google`).
- [x] `app/globals.css`: hapus `@font-face` Satoshi, perbarui `--font-body` dan
      `--font-heading`, pindahkan `font-family` ke `body`.
- [x] `components/shared/Navbar.tsx`: ganti search inline menjadi trigger modal,
      perbaiki dropdown, tambah state aktif, naikkan target sentuh ke 44px.
- [x] `components/shared/NavbarLink.tsx`: tambah state aktif.
- [x] `components/shared/SearchModal.tsx`: buat modal pencarian.
- [x] `lib/search-index.ts`: satukan data yang dapat dicari.
- [x] `app/search/page.tsx`: halaman hasil pencarian.
- [x] `components/features/Homepage/Hero.tsx`: hero layanan-first, 6 kartu layanan, tanpa carousel.
- [ ] Buat `SectionHeader` untuk menghilangkan duplikasi header section.
- [ ] Selaraskan radius di seluruh komponen.
- [ ] Selaraskan container (`max-w-7xl` vs 1200px).
- [ ] Hapus class shadow yang tidak terpakai di komponen UI.

---

## 8. Verifikasi

Perubahan navbar, font, dan pencarian sudah diverifikasi dengan:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

Ketiganya lulus tanpa error.

---

## 9. Temuan teknis terkait

- Setiap `app/**/layout.tsx` di bawah root merender `<html>` dan `<body>` lagi.
  Hanya root layout yang seharusnya melakukan itu.
- Halaman `[slug]` mengetik `params` sebagai `Promise`, tetapi belum di-`await`.
- Belum ada test runner, test script, atau API backend.
- Semua konten masih statis dan hardcoded di komponen.
- `next lint` memakai `eslint.config.mjs`; `.eslintrc.json` tidak dipakai.
