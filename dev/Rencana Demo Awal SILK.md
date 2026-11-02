# Rencana Demo Awal SILK

Nov 2, 2026 · @Akhmad Dany

## Ringkasan

Demo awal SILK adalah website MVP yang tayang publik sebelum demo day 20 Desember 2026, dipakai untuk menjaring pengguna aktif pertama di Malang dan sekitarnya. Stack mengganti Strapi, Google Maps, dan Midtrans di SRS v1.0 dengan pilihan yang lebih murah dan lebih cepat dikerjakan tim kecil.

| Lapisan | SRS v1.0 | Demo awal |
| --- | --- | --- |
| Struktur repo | Belum diputuskan | Monorepo (Turborepo + pnpm workspaces) |
| Frontend + backend | Next.js + Strapi CMS | Next.js App Router, REST API lewat Route Handlers di app yang sama |
| Database | Tidak disebut | NeonDB (Postgres serverless) + PostGIS, akses lewat Drizzle ORM |
| Peta | Google Maps API | OpenStreetMap: Leaflet + tile OSM, geocoding Nominatim |
| Payment gateway | Midtrans | Duitku (sandbox dulu, lalu produksi) |
| AI Chat | OpenAI API | Ditunda ke fase setelah demo |
| Hosting | AWS atau setara | Vercel (app) + Neon (DB) |

Tiga fitur masuk demo: pencarian faskes dengan peta OSM, langganan mitra via Duitku, dan marketplace apotek via Duitku. Fitur lain menunggu sampai ada pengguna aktif, sesuai keputusan rapat 31 Oktober untuk menambah fitur bertahap.

## Scope demo awal

Demo memuat 7 kebutuhan fungsional dari SRS secara penuh atau sebagian; 4 sisanya ditunda. Kategori mitra dibatasi ke dokter, rumah sakit, klinik, laboratorium, dan apotek supaya data awal bisa diisi tangan oleh tim.

| Kode SRS | Fitur | Status di demo | Catatan cakupan |
| --- | --- | --- | --- |
| F-01 | Autentikasi & manajemen pengguna | Masuk | Email + password dan Google login, verifikasi email. Role: pasien, mitra, apotek, admin |
| F-02 | Manajemen profil layanan | Masuk | Foto, deskripsi, alamat + titik peta, jadwal, daftar layanan dengan kisaran harga. Video profil lewat link YouTube saja |
| F-03 | Pencarian & filter | Masuk | Kategori, radius dari lokasi pengguna, rentang harga, rating. Tampilan daftar + peta |
| F-06 | Marketplace apotek | Masuk | Katalog obat bebas dan produk kesehatan, keranjang, checkout Duitku, status pesanan. Obat keras dengan resep ditunda |
| F-08 | Rating & ulasan | Masuk | Hanya pengguna login, filter kata kasar sederhana, antrean moderasi admin |
| F-10 | Panel admin | Masuk | Verifikasi mitra dan apotek, moderasi ulasan, kelola data, ringkasan transaksi |
| F-11 | Email notifikasi | Masuk | Verifikasi akun, reset password, konfirmasi pembayaran |
| Baru | Langganan mitra | Masuk | Trial 6 bulan otomatis saat mitra disetujui, lalu bayar tahunan via Duitku |
| F-04 | AI Chat | Ditunda | Butuh kurasi prompt dan disclaimer medis yang matang |
| F-05 | Artikel edukasi | Ditunda | Bisa diganti halaman statis sementara |
| F-07 | Rekam medis digital | Ditunda | Terikat Permenkes 24/2022, butuh kajian keamanan tersendiri |
| F-09 | Notifikasi dalam aplikasi | Ditunda | Email sudah cukup untuk demo |

Ide dari notulen (dokter hewan, asuransi, resep ke apotek terdekat) masuk backlog setelah demo day. Resep ke apotek terdekat paling cocok jadi fitur pertama sesudahnya karena memakai data peta dan marketplace yang sudah ada.

## Arsitektur monorepo

Satu app Next.js menangani halaman sekaligus REST API, sehingga demo cukup satu deploy di Vercel. Monorepo tetap dipakai supaya skema database, logika bisnis, dan komponen UI bisa dipakai ulang oleh aplikasi iOS dan Android nanti.

&#91;embedded content: arsitektur demo SILK · 1 app, 1 database, 4 layanan luar\]

Browser memuat tile peta langsung dari OSM; semua panggilan ke Nominatim, Duitku, dan Resend lewat server supaya kunci API dan batas request terkendali.

```text
silk/
├─ apps/
│  └─ web/                  Next.js App Router (halaman + /api)
│     ├─ app/(public)/      beranda, cari, profil faskes, apotek
│     ├─ app/(mitra)/       dasbor mitra, langganan
│     ├─ app/(admin)/       verifikasi, moderasi
│     └─ app/api/           search, partners, orders, payments/duitku/callback
├─ packages/
│  ├─ db/                   skema Drizzle, migrasi, seed data Malang
│  ├─ core/                 logika bisnis: langganan, pesanan, DuitkuService
│  ├─ ui/                   komponen shadcn/ui bersama
│  └─ config/               tsconfig, eslint, tailwind bersama
├─ turbo.json
└─ pnpm-workspace.yaml
```

Paket core sengaja tidak bergantung pada Next.js, jadi saat aplikasi mobile dibuat cukup tambah apps/mobile dan memakai core serta db yang sama. Auth memakai Auth.js (NextAuth) dengan adapter Drizzle; variabel rahasia (DATABASE\_URL, DUITKU\_MERCHANT\_CODE, DUITKU\_API\_KEY, RESEND\_API\_KEY) disimpan di environment Vercel, terpisah untuk preview dan produksi.

## Skema data inti di NeonDB

Skema demo cukup 14 tabel, diturunkan dari class diagram SRS bab 4.2 dengan pewarisan User dipadatkan jadi kolom role. Lokasi disimpan sebagai kolom geography PostGIS supaya pencarian terdekat cukup satu query.

| Tabel | Kolom penting | Relasi |
| --- | --- | --- |
| users | id, email, password\_hash, name, phone, role (pasien, mitra, apotek, admin), email\_verified\_at | Induk semua akun |
| partners | id, user\_id, kategori (dokter, rs, klinik, lab, apotek), subkategori, nama, slug, deskripsi, no\_izin, dokumen\_izin\_url, status\_verifikasi, youtube\_url | 1 user ke 1 partner |
| locations | id, partner\_id, alamat, kota, geom geography(Point, 4326), osm\_id | 1 partner ke banyak lokasi |
| services | id, partner\_id, nama, kategori\_layanan, harga\_min, harga\_max, satuan | Harga transparan untuk pembanding |
| schedules | id, partner\_id, hari, jam\_buka, jam\_tutup, catatan | Jadwal praktik |
| reviews | id, partner\_id, user\_id, rating 1 sampai 5, komentar, status\_moderasi | Ulasan + moderasi |
| subscription\_plans | id, kategori\_mitra, harga\_tahunan, durasi\_trial\_hari | Harga per kategori, diisi setelah rapat |
| subscriptions | id, partner\_id, plan\_id, status (trial, aktif, lewat, batal), trial\_end, period\_end | Status langganan mitra |
| products | id, partner\_id (apotek), nama, kategori, golongan\_obat, harga, stok, gambar\_url, aktif | Katalog apotek |
| carts, cart\_items | user\_id, product\_id, qty | Keranjang per pengguna |
| orders, order\_items | id, user\_id, apotek\_id, total, ongkir, status, alamat\_kirim | Pesanan marketplace |
| payments | id, merchant\_order\_id, jenis (langganan, pesanan), ref\_id, duitku\_reference, metode, amount, status, raw\_callback jsonb | Satu tabel untuk dua alur Duitku |

Golongan obat dicatat sejak awal (bebas, bebas terbatas, keras) supaya checkout bisa menolak obat keras sampai alur resep tersedia. Kolom raw\_callback menyimpan isi callback Duitku apa adanya untuk audit.

## Peta berbasis OpenStreetMap

Peta memakai Leaflet (react-leaflet) dengan tile resmi OSM untuk demo, dan pencarian terdekat dihitung sendiri di Postgres. Server tile dan geocoding milik OSM Foundation gratis tapi tanpa SLA, jadi aturannya harus dipatuhi sejak hari pertama.

| Komponen | Pilihan demo | Aturan yang wajib diikuti |
| --- | --- | --- |
| Render peta | react-leaflet, komponen dimuat client side saja (dynamic import, ssr false) | Atribusi "© OpenStreetMap contributors" selalu terlihat di pojok kanan bawah |
| Tile | tile.openstreetmap.org | Hanya minta tile viewport aktif, tanpa prefetch atau mode offline, Referer tidak dihapus ([kebijakan tile](https://operations.osmfoundation.org/policies/tiles/)) |
| Geocoding | Nominatim, dipanggil lewat route handler server, hasil di-cache di tabel | Maksimal 1 request per detik untuk seluruh aplikasi, User-Agent unik bernama SILK, tanpa autocomplete ([kebijakan Nominatim](https://operations.osmfoundation.org/policies/nominatim/)) |
| Titik lokasi mitra | Mitra menggeser pin di peta, lalu reverse geocode sekali untuk mengisi alamat | Koordinat disimpan di kolom geom, tidak perlu geocoding ulang |
| Lokasi pengguna | Geolocation API browser, fallback pilih kecamatan di Malang | Lokasi pengguna tidak disimpan tanpa izin |
| Pencarian terdekat | PostGIS ST\_DWithin + ORDER BY jarak, indeks GiST pada geom | Tidak bergantung API luar sama sekali |

Query inti pencarian terdekat:

```sql
SELECT p.id, p.nama, p.kategori,
       ST_Distance(l.geom, ST_MakePoint($lng, $lat)::geography) AS jarak_m
FROM partners p
JOIN locations l ON l.partner_id = p.id
WHERE p.status_verifikasi = 'disetujui'
  AND p.kategori = $kategori
  AND ST_DWithin(l.geom, ST_MakePoint($lng, $lat)::geography, $radius_m)
ORDER BY jarak_m
LIMIT 50;
```

Kolom alamat di form pencarian memakai tombol Cari, bukan saran otomatis per ketikan, karena autocomplete ke Nominatim publik dilarang. Kalau trafik setelah demo melewati batas wajar, tile dan geocoding dipindah ke penyedia komersial berbasis OSM atau server sendiri; kodenya cukup ganti URL tile.

Untuk mengisi direktori awal, data RS, klinik, dokter, lab, dan apotek di Malang bisa diimpor sekali dari OSM (tag amenity=hospital, clinic, doctors, pharmacy) sebagai profil "belum diklaim". Data ini berlisensi ODbL: atribusi wajib, dan data OSM perlu disimpan terpisah dari data harga milik SILK supaya kewajiban share-alike tidak ikut ke data internal. Status lisensi ini sebaiknya dicek ulang sebelum produksi.

## Integrasi Duitku

Langganan mitra dan checkout apotek memakai satu modul pembayaran Duitku POP; yang membedakan hanya awalan merchantOrderId (SUB atau ORD). Seluruh pengembangan jalan di sandbox dulu, akun produksi diurus paralel karena butuh website yang sudah tayang.

### Syarat pendaftaran

- Merchant perorangan butuh KTP, NPWP, dan rekening bank atas nama yang sama; badan usaha butuh dokumen lebih lengkap dan perjanjian kerja sama ([syarat Duitku](https://www.duitku.com/?p=3597)).
- Website harus sudah tayang dan bukan subdomain website builder, jadi SILK perlu domain sendiri sebelum mengajukan akun produksi.
- Daftar bisnis yang ditolak Duitku memuat "Drugs and all their equipment". Penjualan obat lewat marketplace apotek wajib dikonfirmasi tertulis ke Duitku sebelum fitur ini dibuka untuk umum. Langganan mitra tidak terkena aturan ini.

### Biaya per transaksi yang relevan

| Metode | Biaya | Contoh: langganan Rp600.000 | Contoh: pesanan Rp75.000 |
| --- | --- | --- | --- |
| QRIS | 0,7% | Rp4.200 | Rp525 |
| Virtual Account bank lain | Rp3.000 | Rp3.000 | Rp3.000 |
| Virtual Account Mandiri | Rp4.000 | Rp4.000 | Rp4.000 |
| Virtual Account BCA | Rp5.000 | Rp5.000 | Rp5.000 |
| OVO, DANA, LinkAja | 1,67% | Rp10.020 | Rp1.253 |
| ShopeePay | 2% | Rp12.000 | Rp1.500 |
| Alfamart | Rp2.500 | Rp2.500 | Rp2.500 |
| Kartu kredit | 2,9% + Rp2.500 | Rp19.900 | Rp4.675 |

Tarif dari [daftar harga Duitku](https://duitku.com/?p=722); tidak ada biaya pendaftaran atau bulanan yang tercantum. Angka langganan Rp600.000 masih asumsi sampai satuan "600 per tahun" diputuskan. Untuk pesanan kecil QRIS paling murah, untuk langganan VA bank lain paling murah.

### Alur pembayaran

1. Server membuat baris payments berstatus pending dengan merchantOrderId unik, misalnya SUB-12-1730500000 atau ORD-88-1730500000.
2. Server memanggil createInvoice (sandbox: api-sandbox.duitku.com, produksi: api-prod.duitku.com) dengan header x-duitku-merchantcode, x-duitku-timestamp, dan x-duitku-signature = HMAC-SHA256(merchantCode + timestamp, apiKey).
3. Reference dari respons disimpan, lalu pengguna dibawa ke popup duitku.js atau paymentUrl.
4. Duitku mengirim callback POST form-urlencoded ke /api/payments/duitku/callback. Server memverifikasi signature, mencocokkan amount dengan tabel payments, lalu memperbarui status secara idempoten.
5. Callback sukses memperpanjang period\_end langganan satu tahun, atau mengubah pesanan menjadi dibayar dan memberi tahu apotek lewat email.
6. returnUrl hanya untuk halaman hasil; status resmi hanya dari callback, dengan cek transactionStatus sebagai cadangan kalau callback tidak datang ([dokumentasi POP](https://docs.duitku.com/pop/en), [dokumentasi API](https://docs.duitku.com/api/en)).

Verifikasi callback di route handler:

```ts
import crypto from "node:crypto";

export async function POST(req: Request) {
  const f = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;
  const expected = crypto
    .createHmac("sha256", process.env.DUITKU_API_KEY!)
    .update(f.merchantCode + f.amount + f.merchantOrderId)
    .digest("hex");
  if (expected !== f.signature) return new Response("bad signature", { status: 400 });

  await settlePayment({
    merchantOrderId: f.merchantOrderId,
    amount: Number(f.amount),
    reference: f.reference,
    success: f.resultCode === "00",
    raw: f,
  }); // cek amount, idempoten, update langganan atau pesanan

  return new Response("OK", { status: 200 });
}
```

Dokumentasi Duitku tidak konsisten soal kode gagal (01 atau 02), jadi perilaku ini perlu dicoba di sandbox. Duitku mengulang callback sampai 5 kali kalau server tidak membalas 200.

### Catatan alur dana marketplace

Uang pesanan masuk ke rekening merchant SILK, lalu SILK meneruskan ke apotek (biaya transfer BI-Fast Rp2.500 per transfer). Untuk demo cukup 1 sampai 3 apotek mitra dengan pencairan manual mingguan dan potongan komisi yang disepakati tertulis.

## Roadmap dan timeline mingguan

Sisa waktu ke demo day 7 minggu, dan titik kritisnya 22 November: website harus tayang di domain sendiri supaya pengajuan akun Duitku produksi masih sempat diproses. Fitur dibekukan 13 Desember, seminggu sebelum demo day, sesuai keputusan untuk mengecek demo web lebih dulu.

&#91;embedded content: timeline demo SILK · 7 minggu, 2 Nov sampai 20 Des 2026\]

Pengisian data dan klaim mitra berjalan paralel dengan coding karena keduanya pekerjaan non-teknis yang bisa dipegang anggota tim berbeda.

Setelah demo day, fitur ditambah bertahap mengikuti pengguna aktif (usulan):

1. Fase 2, Januari sampai Februari 2027: AI Chat rekomendasi, artikel edukasi, resep dokter ke apotek terdekat, notifikasi dalam aplikasi.
2. Fase 3, mulai Maret 2027: aplikasi iOS dan Android memakai packages/core dan packages/db yang sama.
3. Fase 4: kategori baru dari notulen, yaitu dokter hewan dan asuransi, setelah model langganan terbukti.

## Strategi mendapatkan pengguna aktif

SILK punya dua sisi pengguna, dan sisi mitra harus diisi lebih dulu: pasien tidak akan kembali ke direktori yang kosong. Urutannya isi data, tarik mitra, baru tarik pasien.

| Tahap | Sasaran | Cara | Ukuran berhasil (usulan) |
| --- | --- | --- | --- |
| 1. Isi direktori | Faskes di Malang | Impor data OSM + input manual harga dari papan tarif, situs RS, dan telepon | Minimal 150 profil dengan alamat dan titik peta, 50 di antaranya punya kisaran harga |
| 2. Klaim profil | Dokter muda, klinik, RS swasta | Kunjungan langsung, WhatsApp, jaringan alumni kedokteran; tawarkan trial 6 bulan gratis | 30 mitra terverifikasi, 10 di antaranya aktif memperbarui profil |
| 3. Apotek percontohan | 1 sampai 3 apotek | Kerja sama langsung, katalog obat bebas saja | 20 pesanan berhasil dibayar lewat Duitku sebelum demo day |
| 4. Pasien awal | Mahasiswa dan warga Malang | Konten perbandingan harga di TikTok dan Instagram, grup WhatsApp kampus, poster QR di sekitar apotek mitra | 500 pengguna terdaftar |
| 5. Retensi | Pengguna terdaftar | Email ulasan setelah kunjungan, pengingat stok obat | Pengguna aktif mingguan stabil 4 minggu berturut-turut |

**Definisi pengguna aktif** untuk laporan demo day: pasien yang dalam 30 hari terakhir melakukan pencarian sambil login, membuka profil, memberi ulasan, atau membayar pesanan; mitra yang memperbarui profil atau menerima ulasan dalam 30 hari terakhir.

Event yang dicatat sejak hari pertama: daftar, cari, buka profil, klik arah peta, klik hubungi, tambah ke keranjang, bayar sukses, kirim ulasan, klaim profil. Cukup satu tabel events di Neon plus analitik halaman bawaan Vercel, tanpa alat tambahan.

## RAB proyek web

Biaya tunai demo web sampai 20 Desember sekitar Rp2,5 juta, dan hampir separuhnya promosi serta lapangan; infrastruktur hampir seluruhnya gratis. Biaya tenaga kerja tim tidak dihitung. Kurs memakai Rp18.200 per USD, dibulatkan ke atas dari Rp18.146 pada 30 Oktober 2026 ([sumber](https://listrikindonesia.com/detail/21613/rupiah-hari-ini-tertekan-dolar-as-menguat-ke-rp18146)).

| Pos | Rincian | Biaya (Rp) | Dasar |
| --- | --- | --- | --- |
| Domain .com | 1 tahun, perpanjangan Rp195.000 | 121.900 | [Rumahweb](https://www.whtop.com/id/plans/rumahweb.com/82985) |
| Vercel Pro | US$20 per bulan, 1 seat developer, 2 bulan | 728.000 | [Vercel](https://vercel.com/pricing): paket Hobby hanya untuk non-komersial |
| NeonDB | Paket Free (1 GB per proyek, 100 CU-jam per bulan) + cadangan kalau pindah ke Launch | 100.000 | [Neon](https://neon.com/pricing) |
| Email transaksional | Resend Free, 3.000 email per bulan, 100 per hari | 0 | [Resend](https://resend.com/pricing) |
| Peta OSM | Tile dan Nominatim publik | 0 | Kebijakan OSMF |
| Duitku | Tanpa biaya daftar; biaya per transaksi dipotong dari dana masuk | 0 | [Duitku](https://duitku.com/?p=722) |
| Uji transaksi nyata | Beberapa pembayaran kecil di akun produksi | 100.000 | Usulan |
| Cetak promosi | Poster dan stiker QR untuk apotek mitra dan kampus | 300.000 | Usulan |
| Iklan media sosial | TikTok dan Instagram, 2 minggu sebelum demo day | 500.000 | Usulan |
| Transport lapangan | Kunjungan klaim profil mitra | 400.000 | Usulan |
| Cadangan | 10% dari subtotal Rp2.249.900 | 224.990 |  |
| **Total** |  | **2.474.890** |  |

Setelah demo, biaya jalan bulanan minimum sekitar Rp380.000 (Vercel Pro plus domain dicicil per bulan), selama Neon dan Resend masih di paket gratis. Pos bertanda usulan bisa diubah tim di rapat Sabtu.

## Revisi SRS, risiko, dan bahan rapat Sabtu

SRS v1.0 perlu dinaikkan ke v1.1 supaya bab 2 dan 3 sesuai stack baru; bab 4 sudah mencatat Strapi tidak dipakai.

### Bagian SRS yang diubah

| Bagian | Isi lama | Isi baru |
| --- | --- | --- |
| 2.1, 2.5 d, 3.3, 4.1 | Midtrans API | Duitku POP |
| 2.1, 2.5 d, 3.3, 4.1 (UC-05) | Google Maps API | OpenStreetMap (Leaflet, Nominatim) + PostGIS |
| 2.5 g | Server cloud AWS atau setara | Vercel + NeonDB |
| 3.3 | Backend Strapi CMS | REST API Next.js Route Handlers dalam monorepo |
| 3.4 Maintainability | Berbasis Strapi & Next.js | Monorepo Turborepo: Next.js, Drizzle, paket bersama |
| 3.1 | F-01 sampai F-11 | Tambah F-12 Langganan Mitra; tandai F-04, F-05, F-07, F-09 sebagai fase 2 |
| Class diagram 4.5 | MidtransService | DuitkuService |

### Risiko utama

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Duitku menolak penjualan obat | Marketplace apotek tidak bisa terima pembayaran | Tanya tertulis ke Duitku minggu ini; cadangan: marketplace tampil sebagai katalog + pesan via WhatsApp apotek saat demo |
| Akun produksi Duitku belum aktif sebelum demo day | Demo hanya bisa di sandbox | Domain dan website tayang paling lambat minggu ke-3, pengajuan langsung setelahnya |
| Server OSM memblokir akses | Peta kosong | Patuhi kebijakan tile, siapkan URL tile penyedia lain di variabel lingkungan |
| Data harga faskes sedikit | Fitur pembanding terasa kosong | Tim mengisi manual 50 profil berharga sebelum promosi pasien dimulai |
| Tim kecil, waktu 7 minggu | Fitur molor | Fitur di luar scope masuk backlog, bukan sprint |

### Keputusan untuk rapat berikutnya

- [ ] Satuan langganan "600 per tahun": Rp600.000 per tahun atau mengikuti Rp100.000 per bulan di pitch deck
- [ ] Harga langganan per kategori: dokter umum, dokter RS, RS, klinik
- [ ] Akun Duitku atas nama perorangan siapa, atau tunggu badan usaha
- [ ] Apotek percontohan mana yang didekati, dan besaran komisi marketplace
- [ ] Nama domain SILK dan akun email resmi
- [ ] Cakupan wilayah tetap Malang seperti SRS, atau ikut domisili tim
- [ ] Persetujuan revisi SRS ke v1.1
