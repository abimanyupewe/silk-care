# Breakdown Fungsional Demo SILK

Turunan dari `dev/Rencana Demo Awal SILK.md`. Fokus ke fungsionalitas, tanpa jadwal per tanggal: kerjakan berurutan menurut ketergantungan, secepat mungkin.

Status "ada" diambil dari `AGENTS.md` dan daftar route, belum diverifikasi satu per satu di kode.

## Keputusan

| Topik | Keputusan | Alasan |
| --- | --- | --- |
| Struktur repo | Tetap satu app Next.js + Prisma, tanpa Turborepo/Drizzle | Banyak fitur sudah jadi; migrasi tidak menambah fitur. Monorepo ditunda sampai ada aplikasi mobile |
| Pencarian terdekat | Haversine + bounding box (`lib/geo.ts`), tanpa PostGIS | Cukup untuk ratusan profil di Malang |
| Klaim profil | Tidak dibuat | Dikeluarkan dari scope |
| Login/daftar Google | Ditunda ke setelah demo | Email + password sudah cukup untuk demo |
| Impor OSM | Tidak dibuat; direktori diisi lewat skrip seed dari CSV | Tanpa klaim, profil impor tidak punya pemilik; hindari kewajiban ODbL |
| `youtubeUrl` | Tidak dibuat | Upload video Cloudinary sudah ada |
| Obat di Duitku | Dianggap aman | Simpan konfirmasi tertulis sebelum akun produksi diajukan |
| Peta | Leaflet + tile OSM publik, URL tile lewat env | Mudah diganti ke penyedia lain |

## Kebutuhan per fitur

| Fitur | Kebutuhan fungsional | Status | Yang dikerjakan |
| --- | --- | --- | --- |
| F-01 Auth | Daftar, login, verifikasi email, reset password, role | Ada | Tidak ada. Google login ditunda ke setelah demo |
| F-02 Profil layanan | Foto, deskripsi, alamat + titik peta, jadwal, layanan dengan kisaran harga | Sebagian besar ada. `FacilityService.priceMin/priceMax`, `consultationFee` dokter, upload Cloudinary | Pin peta yang bisa digeser di form profil |
| F-03 Pencarian | Kategori, radius, harga, rating, daftar + peta | Rating, radius, ketersediaan ada | Filter rentang harga, tampilan peta Leaflet, tombol Cari alamat (Nominatim), fallback pilih kecamatan |
| F-06 Marketplace | Katalog, keranjang, checkout, status pesanan | Ada, tapi `transactionsEnabled=false` | Checkout Duitku, kolom `golongan` di `Product`, tolak obat keras, nyalakan flag untuk order |
| F-08 Ulasan | Hanya user login, filter kata kasar, moderasi | Ada, termasuk moderasi | Filter kata kasar sederhana |
| F-10 Admin | Verifikasi mitra, moderasi, kelola data, ringkasan transaksi | Panel `/admin`, stats, audit log ada | Ringkasan pembayaran Duitku; putuskan verifikasi mitra tetap otomatis atau tidak |
| F-11 Email | Verifikasi, reset, konfirmasi bayar | Ada | Template email pembayaran dan pengingat langganan |
| Langganan mitra | Trial 6 bulan, lalu bayar tahunan; setelah habis, login tetap bisa tapi dashboard diarahkan ke pricing | Trial (`startTrial`), `SubscriptionPrice` per tipe ada | Halaman pricing langganan, gerbang akses (lihat "Aturan akses saat langganan habis"), bayar via Duitku, perpanjang `endsAt` +1 tahun, status lewat/batal, email pengingat |

## Aturan akses saat langganan habis

Mitra (`DOCTOR`, `FACILITY`, `PHARMACY`) yang trial atau langganannya sudah habis (`endsAt <= now`):

- **Tetap bisa login.** Login tidak diblokir.
- **Tidak bisa memakai fitur dan dashboard.** Semua halaman `/dashboard/dokter` dan `/dashboard/fasilitas` mengarahkan ke halaman pricing langganan.
- **Halaman yang tetap bisa dibuka:** pricing langganan (pilih paket dan bayar via Duitku), halaman hasil bayar, dan logout.
- **API mitra** (`/api/v1/doctor/*`, `/api/v1/facility/*`, `/api/v1/partner/*`) menolak dengan error yang bisa dikenali client, supaya `fetchApi` bisa mengarahkan ke pricing. Route pembayaran langganan dikecualikan.
- **Setelah bayar,** callback Duitku memperpanjang `endsAt` dan akses langsung pulih tanpa login ulang.
- **Katalog publik** sudah menyembunyikan mitra yang `endsAt <= now` lewat `publicDoctorWhereAt` dan kawan-kawannya, jadi tidak perlu perubahan.

Implementasi: satu pengecekan di tempat yang sudah dilewati semua panel, yaitu `getActiveSession()` / `layout.tsx` panel (untuk halaman) dan `lib/doctor-guard.ts` / `lib/facility-guard.ts` (untuk API). Jangan menyebar cek langganan ke tiap halaman atau route.

## Kebutuhan lintas fitur

1. **Modul Duitku.** Satu modul untuk dua alur (awalan `SUB` dan `ORD`):
   - buat invoice dengan signature HMAC-SHA256;
   - route callback: verifikasi signature, cek amount, idempoten, simpan `raw_callback`;
   - cek `transactionStatus` sebagai cadangan kalau callback tidak datang;
   - `PaymentProvider` di `lib/payments/types.ts` masih berbentuk Midtrans (`statusCode`, `signatureKey`, `grossAmount`, nama provider hanya `'midtrans'`), jadi tipenya perlu dilonggarkan.
2. **Seed direktori.** Skrip baca CSV, buat mitra `VERIFIED` + trial + titik peta + harga. Target 50 sampai 150 profil Malang, 1 sampai 3 apotek dengan katalog obat bebas.
3. **Event tracking.** Tabel `events`: daftar, cari, buka profil, klik arah, klik hubungi, tambah keranjang, bayar sukses, ulasan.
4. **Deploy.** Domain sendiri di Vercel + Neon, env terpisah untuk preview dan produksi.

## Urutan kerja

| # | Paket | Isi | Bergantung pada |
| --- | --- | --- | --- |
| 1 | Pembayaran Duitku + gerbang langganan | Longgarkan tipe provider, `lib/payments/duitku.ts`, callback, halaman pricing, bayar langganan (`SUB`) di sandbox, redirect mitra yang langganannya habis | - |
| 2 | Peta dan pencarian | Leaflet, pin lokasi, filter harga, Cari alamat (Nominatim: cache, 1 req/detik, User-Agent SILK) | - (paralel dengan 1) |
| 3 | Data awal | Skrip seed Malang dari CSV | 2 untuk titik peta |
| 4 | Marketplace | `golongan`, tolak obat keras, order via Duitku (`ORD`), nyalakan flag | 1 |
| 5 | Pelengkap | Filter kata kasar, `events`, email langganan, ringkasan pembayaran admin | 1 untuk email dan ringkasan |
| 6 | Deploy | Domain sendiri, env produksi, ajukan akun produksi Duitku | 1 jalan di sandbox |

Deploy (6) tidak perlu menunggu 4 dan 5; makin cepat domain tayang, makin cepat akun produksi Duitku diproses.

## Aturan OSM yang wajib dipatuhi

- Atribusi "© OpenStreetMap contributors" selalu terlihat.
- Tile hanya untuk viewport aktif, tanpa prefetch; Referer tidak dihapus.
- Nominatim hanya lewat server: 1 request per detik untuk seluruh app, User-Agent unik, tanpa autocomplete, hasil di-cache.
- URL tile di environment variable. Kalau trafik naik, pindah ke penyedia tile komersial berbasis OSM.

## Yang perlu disiapkan

Nilai rahasia masuk ke `.env` lokal dan environment Vercel, jangan ke git.

| Untuk paket | Yang disiapkan | Dipakai sebagai |
| --- | --- | --- |
| 1 Duitku (sandbox) | Akun sandbox Duitku: merchant code dan API key | `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_ENV=sandbox` |
| 1 Duitku (sandbox) | URL callback yang bisa dijangkau internet saat dev (tunnel seperti ngrok atau cloudflared, atau URL preview Vercel) | Diisi di dashboard Duitku: `<domain>/api/v1/payments/duitku/callback` |
| 1 Harga | Harga langganan per tipe mitra (dokter, RS, klinik, lab, apotek) dan satuannya (per tahun) | Isi `SubscriptionPrice`; sementara placeholder Rp600.000 |
| 2 Peta | Email kontak untuk User-Agent Nominatim (mis. `SILK/1.0 (kontak@domain)`) | Header geocoding |
| 2 Peta | Pilih penyedia tile cadangan (opsional, bisa nanti) | `NEXT_PUBLIC_TILE_URL` |
| 3 Data awal | CSV profil Malang: nama, tipe, alamat, koordinat, telepon, layanan + harga, jadwal. Contoh kolom disepakati sebelum skrip dibuat | Input skrip seed |
| 4 Marketplace | 1 sampai 3 apotek percontohan dan katalog obat bebas (nama, kategori, harga, stok, gambar). Tandai golongan: bebas, bebas terbatas, keras | Seed produk |
| 4 Marketplace | Email atau dokumen tertulis dari Duitku soal penjualan obat | Syarat akun produksi |
| 5 Email | Akun Resend, domain pengirim terverifikasi (DNS SPF/DKIM) | `RESEND_API_KEY`, `EMAIL_FROM` |
| 6 Deploy | Nama domain dan akses DNS; akun Vercel (Pro, karena komersial); proyek Neon produksi terpisah dari dev | Domain, env produksi, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| 6 Duitku produksi | KTP, NPWP, rekening bank atas nama yang sama (perorangan), website sudah tayang di domain sendiri | Pengajuan akun produksi |
| Semua | `AUTH_SECRET`, `CRON_SECRET`, kredensial Cloudinary (sudah dipakai di fitur yang ada) | Cek `.env.example` saat implementasi |

Yang paling mendesak: akun sandbox Duitku dan harga langganan (paket 1), lalu nama domain (paket 6, penentu pengajuan akun produksi).

## Keputusan yang masih terbuka

- [ ] Satuan harga langganan: Rp600.000 per tahun atau Rp100.000 per bulan, dan beda per kategori atau tidak (mengisi `SubscriptionPrice`).
- [ ] Verifikasi mitra: tetap otomatis atau admin menyetujui lagi.
- [ ] Akun Duitku atas nama siapa, dan konfirmasi tertulis soal obat.
- [ ] Apotek percontohan dan komisi marketplace.
- [ ] Nama domain dan email resmi.

## Belum diperiksa

- Pemakaian `SubscriptionPrice` di kode (apakah sudah ada route atau UI admin).
- Alur `startTrial` sampai masa trial habis.
- Apakah `Product` sudah punya kolom yang bisa dipakai untuk `golongan`.
- Kebijakan OSMF belum dibuka ulang; cek sebelum produksi.
