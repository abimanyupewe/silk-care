# Direktori mitra berlangganan — desain

Tanggal: 2026-10-31. Status: menunggu review. Basis kode: branch baru dari `staging`.

## Tujuan

Mengubah SILK dari marketplace menjadi direktori mitra kesehatan berbasis peta. Dokter dan
fasilitas hanya menampilkan informasi (profil, kontak, lokasi, jam operasional). Hanya mitra
berlangganan aktif yang tampil, dan pengguna menemukan mitra terdekat lewat peta.

Keberhasilan:

1. Calon mitra mendaftar lewat form bertahap sesuai tipenya, langsung tayang, dan mendapat 6 bulan
   gratis.
2. Mitra membayar perpanjangan lewat Duitku dari panel. Harga diatur admin per tipe.
3. Saat langganan habis, mitra hilang dari seluruh permukaan publik tanpa menunggu cron.
4. Pengguna melihat mitra aktif terdekat di peta dan membuka halaman detail dari data asli.

## Keputusan yang sudah diambil

- Berlaku untuk fasilitas dan dokter: hanya informasi. Transaksi dimatikan, kode dan data disimpan.
- Ulasan, artikel, dan akun pasien tetap ada.
- Masa gratis 6 bulan hanya untuk pendaftar baru, dihitung sejak mendaftar. Belum ada mitra
  sungguhan, jadi tidak ada migrasi masa gratis; seed diperbarui.
- Langganan 1 tahun. Enterprise: harga dan durasi ditentukan admin per mitra.
- Harga per tipe (11 tipe: 10 fasilitas + dokter), dikelola dari panel admin.
- Pembayaran memakai Duitku POP. Midtrans tidak dipakai, tetapi kodenya tetap ada.
- Verifikasi admin dimatikan sementara: mitra baru langsung `VERIFIED`. Status `REJECTED` dari
  endpoint verifikasi admin tetap menurunkan mitra dari katalog.
- Spasial: kolom `Float` + indeks + bounding box, lewat satu fungsi. Target awal sekitar 100 mitra.
- Field khusus tipe adalah **draf** hasil brainstorming, akan dicek silang dengan client.

## Di luar cakupan

Unggah dokumen, refund otomatis, perpanjangan otomatis, perpanjangan manual oleh admin, PostGIS,
filter jarak pada `GET /doctors` dan `/facilities` yang sudah ada, dan penghapusan kode transaksi.

## Fase

Satu spec, tiga fase yang masing-masing bisa dirilis:

| Fase          | Isi                                                                           | Butuh kredensial             |
| ------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| 1. Fondasi    | Registry, form bertahap, masa gratis, filter katalog, sakelar transaksi, seed | Tidak                        |
| 2. Pembayaran | Duitku, menu Langganan, admin harga dan enterprise, pengingat                 | Key Duitku untuk uji sandbox |
| 3. Peta       | Endpoint peta, halaman peta, halaman detail, form ulasan                      | Key Google Maps              |

Pemilih titik pada form fase 1 butuh Google Maps. Sampai key tersedia, form menampilkan tombol
"Gunakan lokasi saya" dan isian lintang/bujur manual, sehingga fase 1 tetap bisa dijalankan.

## Model data

Satu migrasi `partner_subscriptions` di fase 1 (seluruh tabel, supaya skema tidak berubah antarfase).

```prisma
enum SubscriptionPlan {
  FREE_TRIAL
  YEARLY
  ENTERPRISE
}

model Subscription {
  id                   String           @id @default(cuid())
  userId               String           @unique
  user                 User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan                 SubscriptionPlan
  endsAt               DateTime
  customAmount         Int?
  customDurationMonths Int?
  lastReminderDays     Int?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  payments SubscriptionPayment[]

  @@index([endsAt])
}

model SubscriptionPayment {
  id              String               @id @default(cuid())
  subscriptionId  String
  subscription    Subscription         @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  plan            SubscriptionPlan
  amount          Int
  durationMonths  Int
  status          PaymentAttemptStatus @default(PENDING)
  merchantOrderId String               @unique
  reference       String?
  paymentUrl      String?
  rawPayload      Json?
  paidAt          DateTime?
  expiresAt       DateTime?
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  @@index([subscriptionId])
  @@index([status])
}

model SubscriptionPrice {
  partnerType String   @id
  amount      Int
  updatedAt   DateTime @updatedAt
}
```

Tambahan pada `Facility` dan `DoctorProfile`: `details Json?`, `internalDetails Json?`, dan
`@@index([latitude, longitude])`. `User` mendapat relasi `subscription Subscription?`.

Aturan:

- Tampil atau tidak dihitung dari `endsAt > now`; tidak ada kolom status aktif.
- `details` hanya berisi field publik, `internalDetails` hanya field internal. Select publik tidak
  pernah mengambil `internalDetails`, sehingga kebocoran butuh perubahan select secara sengaja.
- Harga pada `SubscriptionPayment` adalah salinan saat transaksi.
- `partnerType` berupa `String` yang divalidasi registry; basis data tidak menolak nilai asing.
- Enterprise cukup mengisi `customAmount` dan `customDurationMonths`. Keduanya diisi atau keduanya
  kosong. Selama terisi, perpanjangan berikutnya memakai nilai itu dengan paket `ENTERPRISE`.
- Tipe tanpa baris harga dan tanpa harga khusus tidak bisa membayar (`409`, pesan jelas).
- Masa dihitung dengan helper `addMonths` sendiri yang membatasi akhir bulan (31 Agustus + 6 bulan =
  28/29 Februari), karena `date-fns` tidak terpasang. `endsAt` baru =
  `addMonths(max(now, endsAt), durationMonths)`.

## Registry kebutuhan mitra

`lib/partner-requirements/`, tanpa impor server agar dipakai klien dan API:

- `partnerTypes = [...facilityTypes, 'DOCTOR']`.
- `Record<PartnerType, PartnerRequirement>`: tipe tanpa entri gagal typecheck.
- `blocks.ts` berisi blok bersama (akun, kontak, lokasi). `types.ts` berisi entri per tipe, masing-
  masing ditandai `draft: true`.
- Field: `key`, `label`, `kind` (`text`, `textarea`, `number`, `boolean`, `select`, `multiselect`,
  `list`, `phone`, `url`), `required`, `options`, `helpText`, `filterable`, dan
  `target` (`column`, `details`, `internal`).
- Pembuat skema murni: requirement → skema Zod per step dan skema penuh. Klien memakai skema per
  step, API memakai skema penuh.
- `RequirementFields` merender field secara generik; dipakai form pendaftaran, form profil panel,
  dan tampilan admin.

### Draf field step 3

Semua publik kecuali yang bertanda internal. Belum final.

| Tipe         | Field                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Rumah sakit  | Kelas RS (pilihan), IGD 24 jam, terima BPJS, poli tersedia (daftar), jumlah tempat tidur (opsional)                     |
| Klinik       | Jenis klinik (pilihan), layanan utama (daftar), terima BPJS, rawat inap                                                 |
| Laboratorium | Jenis pemeriksaan (daftar), perlu rujukan, layanan ke rumah, estimasi hasil                                             |
| Apotek       | Buka 24 jam, layani resep, layanan antar, nama apoteker penanggung jawab (internal)                                     |
| Fisioterapi  | Bidang terapi (daftar), kunjungan ke rumah, perlu rujukan                                                               |
| Radiologi    | Modalitas (rontgen, USG, CT scan, MRI, mammografi), perlu rujukan, estimasi hasil                                       |
| Rumah duka   | Layanan (pemulasaraan, peti, transportasi jenazah, kremasi), layanan 24 jam, kapasitas ruang (opsional)                 |
| Wellness     | Kategori layanan (daftar), wajib reservasi                                                                              |
| Pijat        | Jenis pijat (daftar), terapis tersedia (pria, wanita), layanan ke rumah, wajib reservasi                                |
| Ambulans     | Jenis armada (transport, gawat darurat, jenazah), layanan 24 jam, nomor darurat, area layanan, jumlah armada (opsional) |
| Dokter       | Gelar, tempat praktik (daftar), pendidikan (daftar), bahasa (daftar), nomor STR (internal, opsional)                    |

Semua fasilitas (step 2): telepon, WhatsApp, website, nomor izin usaha (internal, opsional).
Dokter (step 2): spesialisasi, bio, lama pengalaman, telepon, WhatsApp. Nama dokter memakai
`User.name`, karena `DoctorProfile` tidak punya kolom nama.

## Sign in dan sign up

Sign in tidak berubah: satu `/login`, peran menentukan panel. Mitra yang langganannya habis tetap
bisa login untuk memperpanjang.

Sign up: `/mitra/daftar` menjadi satu-satunya pintu.

| Step           | Isi                         | Catatan                              |
| -------------- | --------------------------- | ------------------------------------ |
| 1. Akun        | Nama, email, password       | Dilewati bila pasien sudah login     |
| 2. Data dasar  | Pilih tipe, nama, kontak    | Tipe dilewati bila `?type=` valid    |
| 3. Detail tipe | Field dari registry         | Dilewati bila tipe tidak punya field |
| 4. Lokasi      | Kota, alamat, titik di peta | Koordinat wajib                      |
| 5. Tinjau      | Ringkasan dan kirim         | Bisa kembali ke step mana pun        |

- `?type=` menerima tipe fasilitas dan `DOCTOR`. `/mitra/fasilitas` dialihkan ke `/mitra/daftar`,
  dan `isPartnerSignUpUrl` di `lib/roles.ts` mengikuti rute itu.
- Peran selain `PATIENT` yang sudah login dialihkan ke panelnya.
- Isian disimpan di state; password tidak pernah masuk `localStorage` atau `sessionStorage`.
- Akun dibuat di step terakhir: `POST /auth/register`, `signIn`, lalu
  `POST /api/v1/partner/registrations`. Bila langkah terakhir gagal, percobaan ulang tidak membuat
  akun lagi (perilaku `accountReady` yang sudah ada).
- Email sudah terdaftar (`409`) mengembalikan pengguna ke step 1 dengan tautan masuk.
- Tautan "Mitra" di menu menambah pilihan dokter.

`POST /api/v1/partner/registrations` menerima `{ partnerType, values }` dan menggantikan
`POST /partner/doctor` serta `POST /partner/facility`. Dalam satu transaksi: buat profil
`VERIFIED`, ubah peran, buat `Subscription` lewat `startTrial(tx, userId, now)`, dan tulis notifikasi.
Aturan tolak yang lama tetap: admin `403`, profil sudah ada `409`. Teks "menunggu verifikasi admin"
di halaman dan notifikasi diganti informasi masa gratis.

Verifikasi email tidak menjadi syarat tayang. Masa gratis satu kali per akun; email baru tetap bisa
mendapat masa gratis lagi.

## Filter katalog

`publicDoctorWhere`, `publicFacilityWhere`, dan `publicProductWhere` di `lib/catalog.ts` adalah
konstanta dan tidak bisa membawa waktu sekarang. Ketiganya **dihapus**, diganti fungsi bernama baru
`publicDoctorWhereAt(now)`, `publicFacilityWhereAt(now)`, dan `publicProductWhereAt(now)`, yang
memakai satu `activeSubscriptionWhere(now)`:

```ts
user: { deletedAt: null, subscription: { is: { endsAt: { gt: now } } } }
```

Nama baru disengaja. Mengubah konstanta menjadi fungsi dengan nama sama tidak aman: `...publicFacilityWhere`
atas fungsi lolos typecheck (sudah dicoba dengan `tsc --strict`) dan menghasilkan objek kosong,
sehingga filter hilang tanpa error dan mitra kedaluwarsa tampil. Dengan nama baru, pemanggil yang
terlewat gagal saat kompilasi. Ini juga menangkap `lib/home/queries.ts` di `polish/homepage` saat
branch itu digabung.

Pemanggil: `app/api/v1/{doctors,facilities,products}/**`, `search`, `cart/items`, `consultations`,
`appointments`, dan `lib/reviews.ts`.

## Sakelar transaksi

`lib/features.ts` (tanpa impor server): `export const transactionsEnabled = false;`

- `isShopFacility` dan `isServiceFacility` mengembalikan `false` saat sakelar mati. Karena dibaca
  oleh `FacilityShell`, `FacilityDashboard`, layout `(shop)`/`(service)`, dan `lib/facility-guard.ts`,
  menu, badge, halaman, dan API panelnya mati dari satu tempat.
- `DoctorShell` dan ringkasan dokter menyembunyikan konsultasi lewat sakelar yang sama.
- `requireTransactions()` mengembalikan `503` pada: `POST /cart/items`, `POST /orders`,
  `POST /orders/{id}/payment`, `POST /consultations`, `POST /appointments`.
- Tetap jalan: endpoint baca, endpoint pembatalan, webhook Midtrans, dan cron kedaluwarsa pesanan.
- `/api/v1/search` tidak mengembalikan produk selama sakelar mati.

## Pembayaran Duitku (fase 2)

`lib/duitku.ts`: `isDuitkuConfigured`, `createInvoice`, `verifyCallbackSignature`. Env:
`DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_IS_PRODUCTION`. Antarmuka `PaymentProvider` tidak
dipakai karena dibentuk mengikuti Midtrans. `callbackUrl` dan `returnUrl` dibentuk dari
`NEXT_PUBLIC_APP_URL`.

- Invoice: `POST {api-sandbox|api-prod}.duitku.com/api/merchant/createInvoice`, header
  `x-duitku-timestamp`, `x-duitku-signature` (HMAC-SHA256 dari `merchantCode + timestamp`), dan
  `x-duitku-merchantcode`. `expiryPeriod` 60 menit.
- `GET /api/v1/subscription`: status, tanggal berakhir, harga, dan riwayat milik mitra.
- `POST /api/v1/subscription/payments`: khusus mitra, dengan rate limit, tanpa isian harga dari
  klien. Bila ada `PENDING` belum habis dengan nominal yang sama, `paymentUrl`-nya dipakai lagi.
  Selain itu buat baris, lalu buat invoice; gagal membuat invoice menandai baris `FAILED` dan
  menjawab `502`. Tanpa konfigurasi `503`.
- `POST /api/v1/payments/duitku/callback`:
  1. Baca lewat `request.formData()` (`x-www-form-urlencoded`).
  2. Verifikasi HMAC-SHA256 dari `merchantCode + amount + merchantOrderId` memakai `timingSafeEqual`.
     Gagal `401`.
  3. Cari lewat `merchantOrderId` (`404` bila tidak ada), cocokkan `amount` (`400` bila beda).
  4. `resultCode` `00`: dalam satu transaksi, `updateMany` dengan syarat status bukan `PAID`. Hanya
     bila satu baris berubah, perpanjang `endsAt`, set `plan`, dan reset `lastReminderDays`.
  5. Kode lain: `PENDING` menjadi `FAILED`. Baris `PAID` tidak pernah diturunkan.
  6. Sesudah transaksi: notifikasi dan email best-effort. Selalu `200` untuk callback sah, termasuk
     pengiriman ulang.
- Pembayaran setelah invoice habis tetap dihitung lunas. Refund dilakukan manual.
- Halaman kembali tidak memercayai parameter URL; panel membaca status dari API.
- Filter IP Duitku tidak dipakai; tanda tangan yang menjadi bukti.

Pengingat ditambahkan ke `app/api/v1/cron/orders/expire/route.ts`: H-30, H-7, H-1, dan hari habis,
berupa notifikasi `ACCOUNT` dan email best-effort. `lastReminderDays` mencegah pengiriman ganda.

## Panel (fase 2)

- Mitra: menu Langganan di `/dashboard/dokter/langganan` dan `/dashboard/fasilitas/langganan`,
  satu komponen bersama. Banner mulai H-30 dan saat habis. Form profil memakai `RequirementFields`.
- Admin: `/admin/langganan` (filter aktif, segera habis, habis), halaman harga 11 tipe, dan harga
  khusus di detail mitra.
- API admin: `GET /admin/subscriptions`, `GET`/`PUT /admin/subscription-prices`,
  `PATCH /admin/subscriptions/{userId}`, memakai `writeAuditLog` dalam transaksi yang sama.

## Peta dan halaman detail (fase 3)

- `findNearbyPartners({ bounds, center, filters, limit })` di `lib/partner-map.ts` adalah satu-
  satunya akses query peta; pindah ke PostGIS hanya mengubah fungsi ini.
- `GET /api/v1/partners/map`: `north`, `south`, `east`, `west` wajib, `west < east`, filter tipe dan
  field `filterable`. Publik dengan rate limit per IP. Mengembalikan pin dokter dan fasilitas aktif,
  urut terdekat dari pusat, maksimal 100, dengan `meta.truncated`.
- Field ya/tidak difilter dengan JSON path pada `details`. Tidak berindeks, tetapi kandidatnya
  sudah dibatasi area peta.
- Halaman `/peta`: peta dengan daftar di sampingnya, memakai `@react-google-maps/api`. Tanpa izin
  lokasi, pengguna memilih kota. Tanpa key, halaman hanya menampilkan daftar per kota.
- `/doctor/[slug]` dan `/apotek/[slug]` saat ini hardcoded, dan `/fasilitas/[slug]` belum ada.
  `/doctor/[slug]` dan `/fasilitas/[slug]` dibuat dari data API. `/apotek/[slug]` dialihkan ke
  `/fasilitas/[slug]`. Mitra kedaluwarsa menghasilkan halaman 404.
- Halaman detail menampilkan profil, jam operasional atau jadwal praktik, `details` sesuai label
  registry, dan ulasan. Form ulasan ditambahkan di sini, karena belum ada UI publiknya.
- Filter jarak lama pada `GET /doctors` dan `/facilities` tidak diubah.

## Seed dan dokumen

- `prisma/seed-demo.ts` dan `prisma/seed-test.ts`: langganan aktif, contoh `details`, baris harga.
  `seed-test` juga butuh koordinat, karena saat ini tidak mengisinya.
- `.env.example`, `docs/openapi.yaml`, `docs/API.md`, `AGENTS.md`, dan `CLAUDE.md` diperbarui di
  fase masing-masing. `npm run openapi:check` wajib lulus.

## Pengujian

Proyek belum punya kerangka tes. Logika murni diberi skrip cek berbasis `assert` yang dijalankan
dengan `tsx`:

- `addMonths`, termasuk akhir bulan, dan perhitungan `endsAt` baru.
- Pembuat skema registry: field wajib, opsi, dan pemisahan `details`/`internalDetails`.
- Tanda tangan Duitku dari nilai uji yang diketahui.

Setiap fase menjalankan `npm run lint`, `npm run typecheck`, dan `npm run openapi:check`. Manual:

- Fase 1: daftar per tipe; ubah `endsAt` ke masa lalu dan pastikan mitra hilang dari daftar, detail,
  pencarian, dan peninjauan.
- Fase 2: callback bertanda tangan dikirim dua kali, masa hanya bertambah sekali; tanda tangan dan
  nominal salah ditolak; lalu alur penuh di sandbox setelah key tersedia.
- Fase 3: geser peta di area padat dan kosong; pastikan field internal tidak ada di respons publik.

## Risiko

- Tanpa verifikasi admin, siapa pun bisa tampil sebagai dokter atau rumah sakit. Perlu keputusan
  client, dan verifikasi sebaiknya hidup sebelum peluncuran publik.
- Field step 3 masih draf dan belum dicek dengan aturan perizinan.
- Belum diuji di sandbox: format `x-duitku-timestamp` ("Jakarta time") dan batas panjang
  `merchantOrderId`. Dokumentasi Duitku tidak konsisten soal kode gagal, jadi hanya `00` yang lunas.
- Peta dan pemilih titik membutuhkan akun penagihan Google Maps; key harus dibatasi per domain.
- `polish/homepage` belum ada di `staging`; `lib/home/queries.ts` perlu disesuaikan saat digabung.
