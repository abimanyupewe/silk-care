# Banner informasi yang dikelola admin — desain

Tanggal: 2026-10-30. Status: menunggu review.

## Tujuan

Admin bisa memasang satu banner informasi di atas navbar situs publik (promo, pengumuman,
gangguan layanan) tanpa mengubah kode. Referensi: bar berwarna di atas navbar dengan pesan,
tautan "selengkapnya", dan tombol tutup.

Keberhasilan: admin membuat banner di `/admin`, banner muncul di halaman publik dalam beberapa
menit, pengunjung bisa menutupnya, dan banner tidak tampil di luar rentang tanggalnya atau saat
dinonaktifkan.

## Keputusan yang sudah diambil

- Admin bisa **menyimpan banyak banner** dan **memilih satu untuk diaktifkan**. Hanya satu
  banner berstatus aktif pada satu waktu: mengaktifkan satu otomatis menonaktifkan yang lain.
  Banner yang aktif tampil selama berada dalam rentang tanggalnya.
- **Template** bawaan (daftar tetap di kode) tersedia saat membuat banner; memilihnya mengisi
  formulir. Banner yang sudah dibuat bisa **diduplikasi** sebagai titik awal banner baru.
- Banner bagian dari `Navbar` publik, **non-sticky** (ikut tergulung). Panel admin, dokter, dan
  fasilitas tidak memakai `Navbar`, jadi tidak menampilkannya.
- Kartu di menu dropdown tetap teks tetap. Menghubungkannya ke banner adalah spec lain.

## Di luar cakupan

Banner ganda yang tampil bersamaan atau bergantian, penargetan per peran atau halaman, teks
kaya/markdown, gambar, statistik tayang/klik, terjemahan, dan template yang bisa diubah atau
disimpan admin di database (duplikasi banner menutupi kebutuhan itu untuk sekarang).

## Data (Prisma, migrasi `announcements`)

`Announcement`
- `id`, `message String` (1–200), `linkLabel String?` (1–40), `linkUrl String?` (maks 500)
- `tone AnnouncementTone @default(INFO)`; enum `AnnouncementTone { INFO PROMO IMPORTANT }`
- `active Boolean @default(false)` (banner baru berupa draf; mengaktifkan harus disengaja karena
  menonaktifkan banner lain), `dismissible Boolean @default(true)`
- `startsAt DateTime?`, `endsAt DateTime?`, `createdAt`, `updatedAt`
- indeks `[active, startsAt, endsAt]`

`AuditLog.targetType` berupa string, jadi cukup menambah `'ANNOUNCEMENT'` ke `auditTargetTypes`
dan tiga aksi ke `auditActions` (`announcementCreate`, `announcementUpdate`,
`announcementDelete`); tidak ada perubahan skema untuk audit.

## Aturan bisnis

Validasi (Zod, dipakai POST dan PATCH):
- `linkUrl` dan `linkLabel` harus diisi bersamaan atau dua-duanya kosong.
- `linkUrl` hanya boleh path internal (diawali `/`, bukan `//`) atau `https://`. Skema lain
  (`javascript:`, `http:`, `data:`) ditolak 422.
- Bila `startsAt` dan `endsAt` keduanya ada, `endsAt` harus setelah `startsAt` (422).
- Pada PATCH, aturan di atas dievaluasi terhadap nilai gabungan (baris lama + perubahan).
- **Satu aktif:** POST atau PATCH yang menghasilkan `active = true` menonaktifkan semua banner
  lain dalam transaksi yang sama. Tidak ada kondisi dengan dua banner aktif. Penjaganya ada di
  database: migrasi menambah indeks unik parsial lewat SQL manual
  (`CREATE UNIQUE INDEX "Announcement_single_active_idx" ON "Announcement" ((true)) WHERE "active"`;
  Prisma tidak bisa mengekspresikannya di schema, jadi ditulis di `migration.sql`). Dua aktivasi
  bersamaan yang bertabrakan mengembalikan 409 ("Banner aktif berubah, muat ulang lalu coba
  lagi") dan tidak pernah menghasilkan dua baris aktif.
- **Placeholder:** `message` yang masih memuat tanda `[` atau `]` (bagian template yang belum
  diisi, misalnya `[tanggal]`) boleh disimpan sebagai draf, tetapi tidak boleh diaktifkan (422
  dengan pesan jelas).

Pemilihan banner tampil (satu fungsi di `lib/announcement.ts`):
`active = true` DAN (`startsAt` kosong ATAU ≤ sekarang) DAN (`endsAt` kosong ATAU > sekarang),
urut `updatedAt` desc, ambil 1 (urutan hanya pengaman; normalnya paling banyak satu baris aktif).

Status tampilan di admin (dihitung klien): **Sedang tampil** (aktif dan dalam rentang),
Terjadwal (aktif, mulai di masa depan), Berakhir (aktif, `endsAt` lewat), Draf (tidak aktif).

Template bawaan (`lib/announcement-templates.ts`, daftar tetap; tiap entri berisi `key`,
`label`, `message`, `tone`, `linkLabel`, `linkUrl`):
- `promo` — PROMO: "Promo bulan ini: nikmati harga spesial untuk layanan pilihan di SILK." +
  tautan "Lihat promo" ke `/fasilitas`
- `maintenance` — IMPORTANT: "Pemeliharaan sistem pada [tanggal dan jam]. Beberapa fitur mungkin
  tidak dapat diakses sementara."
- `incident` — IMPORTANT: "Kami sedang mengatasi gangguan pada [nama fitur]. Mohon maaf atas
  ketidaknyamanannya."
- `new-facility` — INFO: "Fasilitas kesehatan baru telah bergabung di SILK." + tautan "Lihat
  fasilitas" ke `/fasilitas`
- `partner-invite` — INFO: "Punya klinik atau apotek? Daftarkan fasilitas Anda di SILK." + tautan
  "Daftar mitra" ke `/daftar`

## API (semua dengan entri `docs/openapi.yaml`)

Publik: `GET /api/v1/announcements/active` → `{ data: { id, message, linkLabel, linkUrl, tone,
dismissible, updatedAt } | null }`. Tanpa autentikasi. Respons `null` bila tidak ada.

Admin (`requireRole(['ADMIN'])`, anatomi route sesuai `CLAUDE.md`):
- `GET /admin/announcements` (pagination 10; filter `active`), `POST /admin/announcements`
- `GET/PATCH/DELETE /admin/announcements/[id]` (DELETE menghapus baris). Mengaktifkan dan
  menonaktifkan lewat `PATCH { active }`; tidak ada endpoint terpisah.
- Template dan duplikasi tidak butuh endpoint: template adalah konstanta yang dipakai klien,
  dan duplikasi adalah `POST` dengan isi banner asal.
- Setiap mutasi memanggil `writeAuditLog(input, tx)` di transaksi yang sama.

## Tampilan publik

Komponen klien `components/shared/AnnouncementBanner.tsx`, dirender di `Navbar` tepat sebelum
`<nav>`:
- Mengambil `/announcements/active` lewat `useApiQuery` dengan polling 5 menit. Tidak merender
  apa pun sampai data ada; banner bisa muncul sedetik setelah halaman (pergeseran tata letak
  diterima, dicatat sebagai risiko).
- Penutup: kunci `localStorage` `silk-announcement-dismissed` menyimpan `${id}:${updatedAt}`
  (dibungkus try/catch). Banner muncul lagi bila admin mengubahnya. Tombol tutup hanya bila
  `dismissible`.
- Nada: INFO `bg-primary-tint text-primary-deep`, PROMO `bg-amber-tint text-amber-ink`,
  IMPORTANT `bg-destructive text-white`. Tiap nada punya ikon dan label tersembunyi untuk pembaca
  layar (`role="status"`); makna tidak hanya lewat warna. Teks ≥14px, area tekan ≥44px, tanpa
  shadow atau gradient.

## Halaman admin

`/admin/announcements` ("Banner informasi") dengan komponen `AdminAnnouncements.tsx` dan item
menu di grup Sistem pada `AdminShell` (ikon `Info`, karena `Megaphone` dipakai Broadcast).
- Daftar: pesan, nada, status, rentang tanggal. Satu baris diberi lencana "Sedang tampil".
  Aksi per baris: **Aktifkan** / Nonaktifkan, Ubah, **Duplikat**, Hapus (konfirmasi). Mengaktifkan
  satu banner yang lain sedang aktif menampilkan konfirmasi "Banner X akan dinonaktifkan".
- Tombol "Buat banner" membuka pemilih: **Mulai dari template** (lima template di atas, masing
  -masing dengan pratinjau kecil) atau **Banner kosong**.
- Formulir di `AdminModal`: pesan dengan penghitung karakter, tautan opsional, nada, tanggal
  mulai/selesai, dapat ditutup, aktif. Bagian `[…]` yang belum diisi diberi peringatan dan
  tombol aktifkan dinonaktifkan sampai dihapus. **Pratinjau langsung** memakai komponen presentasi
  yang sama dengan banner publik (dipisah dari pengambilan data agar bisa dipakai ulang).
- Tanggal diisi dan ditampilkan dalam Asia/Jakarta.

## Kesalahan dan batas

- Respons error lewat `lib/api.ts`; route dibungkus `handleRouteError`.
- Admin non-ADMIN: 403. Id tidak ada: 404.
- Kegagalan fetch banner di klien diabaikan (tanpa banner), tidak mengganggu halaman.
- Keterlambatan: perubahan admin terlihat di pengunjung sampai 5 menit kemudian.

## Verifikasi

Tanpa kerangka tes: `npm run lint && npm run typecheck`, `npm run openapi:check`, `npm run build`
(dev server mati). Manual: buat banner di admin dan muncul di `/`; tutup lalu muat ulang tetap
tertutup; ubah isi lalu muncul lagi; jadwal masa depan dan yang sudah berakhir tidak tampil;
dinonaktifkan hilang; `javascript:alert(1)` ditolak 422; `endsAt` sebelum `startsAt` ditolak 422;
pengguna non-admin 403; halaman panel tidak menampilkan banner. Template: tiap template mengisi
formulir; template berisi `[…]` tidak bisa diaktifkan (422). Aktivasi: mengaktifkan banner B saat
A aktif menonaktifkan A, dan tidak pernah ada dua baris aktif (cek lewat dua permintaan
bersamaan). Duplikat: salinan berstatus Draf dan tidak mengubah banner asal.
