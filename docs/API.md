# SILK API Contract

Kontrak mesin tersedia di [`docs/openapi.yaml`](./openapi.yaml). Dokumen ini merangkum
konvensi yang dipakai semua endpoint dan data demo yang stabil untuk QA.

## Base path

- API aplikasi: `/api/v1`
- Login Auth.js: `/api/auth`
- Development: `http://localhost:3000`
- Semua body sukses endpoint data memakai JSON. `/api/v1/openapi` adalah pengecualian dan
  mengembalikan YAML.

## Envelope respons

```json
{ "data": {} }
```

```json
{ "data": [], "meta": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 } }
```

```json
{ "error": "Pesan untuk manusia.", "code": "MACHINE_READABLE_CODE", "details": {} }
```

`details` hanya muncul saat ada informasi tambahan, terutama field error validasi.

## Header respons

- `x-request-id` — tersedia pada semua respons `/api/*`. Gunakan ID ini saat melaporkan
  error ke tim backend.
- `Retry-After` — muncul pada `429`, berisi detik sampai limit direset.
- `Idempotent-Replayed` — `true` saat respons merupakan replay idempotency.
- Header keamanan `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, dan
  `Permissions-Policy` dipasang untuk semua route; `Strict-Transport-Security` hanya di
  production.

## Kode error

`code` diturunkan dari status HTTP oleh `jsonError` di `lib/api.ts`. Route tertentu dapat
mengirim kode yang lebih spesifik lewat argumen keempat tanpa mengubah bentuk respons.

| HTTP | `code`                | Arti                                                  |
| ---- | --------------------- | ----------------------------------------------------- |
| 400  | `BAD_REQUEST`         | Body bukan JSON atau permintaan tidak dapat diproses. |
| 401  | `UNAUTHORIZED`        | Belum login, sesi dicabut, atau akun tidak aktif.     |
| 403  | `FORBIDDEN`           | Role tidak berhak atas resource tersebut.             |
| 404  | `NOT_FOUND`           | Resource tidak ada atau tidak terlihat oleh pengguna. |
| 409  | `CONFLICT`            | State bentrok, stok habis, atau idempotency bentrok.  |
| 422  | `VALIDATION_ERROR`    | Body/query gagal validasi; lihat `details`.           |
| 429  | `RATE_LIMITED`        | Limit terlampaui; lihat header `Retry-After`.         |
| 500  | `INTERNAL_ERROR`      | Kesalahan server.                                     |
| 502  | `BAD_GATEWAY`         | Provider eksternal (mis. Midtrans) gagal.             |
| 503  | `SERVICE_UNAVAILABLE` | Integrasi belum dikonfigurasi atau sedang tidak siap. |

Pesan `error` berbahasa Indonesia dan tidak dijamin stabil. Otomasi harus memakai `code`
dan status HTTP, bukan teks pesan. Status yang tidak tercantum memakai `HTTP_<status>`.

## Autentikasi

Auth.js Credentials dengan JWT session.

1. `GET /api/auth/csrf` untuk mendapatkan `csrfToken`.
2. `POST /api/auth/callback/credentials` sebagai
   `application/x-www-form-urlencoded` dengan `csrfToken`, `email`, `password`, dan
   `callbackUrl`.
3. Simpan cookie jar. Nama cookie development: `authjs.session-token`; produksi HTTPS:
   `__Secure-authjs.session-token`.

Endpoint bertanda keamanan di OpenAPI membutuhkan cookie tersebut. `requireUser`
membandingkan `sessionVersion` di token dengan database, sehingga password change/reset
dan deaktivasi akun langsung mencabut token lama.

Role: `PATIENT`, `DOCTOR`, `FACILITY`, `PHARMACY`, `ADMIN`.

## Pagination dan filter

- `page` minimal 1, default 1.
- `limit` 1–50, default 12.
- `meta.totalPages` dihitung dari total dan limit.
- Pencarian katalog memakai `q`; filter kota, tipe, harga, rating, jarak, dan jadwal
  tersedia per endpoint (lihat OpenAPI).
- `day` memakai `1=Senin` sampai `7=Minggu`.
- `time` memakai `HH:mm` zona Asia/Jakarta.
- `lat`/`lng`/`radiusKm` mengaktifkan filter Haversine dan `distanceKm`.
- `minRating`, `sort=rating_desc`, dan `sort=review_desc` memakai agregat ulasan approved.
- `availableNow` memakai hari dan jam Asia/Jakarta saat request.

## Idempotency

Hanya untuk:

- `POST /api/v1/orders` (scope `CHECKOUT`)
- `POST /api/v1/consultations` (scope `CONSULTATION_CREATE`)

Header opsional `Idempotency-Key` (1–100 karakter, `A-Z a-z 0-9 . _ : -`).

- Key + payload sama: respons pertama diputar ulang, termasuk status `201`, dengan header
  `Idempotent-Replayed: true`.
- Key sama + payload berbeda: `409 CONFLICT`.
- Key berlaku 24 jam.
- Replay tidak memakai kuota rate limit; request baru tetap memakai.
- Record ditulis dalam transaksi yang sama dengan order/konsultasi.
- Cron `GET /api/v1/cron/orders/expire` juga menghapus key kedaluwarsa dan log aktivitas pengguna
  yang melewati `AUDIT_ACTIVITY_RETENTION_DAYS` (default 90 hari). Log tindakan admin tidak dihapus.

## Rate limit

Limiter bersifat async. Jika `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`
diisi, counter disimpan di Upstash Redis sehingga konsisten lintas instance. Tanpa
konfigurasi tersebut, aplikasi memakai in-memory per instance untuk development. Jika
Upstash gagal dihubungi, request diloloskan (fail-open) dan kegagalan dicatat di log.

| Area             | Batas                                    |
| ---------------- | ---------------------------------------- |
| Verifikasi email | 20/15 menit per IP, 5/15 menit per email |
| Lupa password    | 20/15 menit per IP, 5/15 menit per email |
| Reset password   | 10/15 menit per IP, 5/15 menit per token |
| Checkout         | 5 / 10 menit                             |
| Buat konsultasi  | 10 / 10 menit                            |
| Buat pembayaran  | 10 / 10 menit                            |
| Signature upload | 30 / 10 menit                            |
| Tulis keranjang  | 60 / menit                               |
| Buat ulasan      | 10 / 10 menit                            |
| AI chat          | 20/10 menit login, 5/10 menit anonim     |
| Broadcast admin  | 5 / 10 menit                             |
| Ubah password    | 5 / 15 menit                             |

Respons `429` menyertakan `Retry-After` dalam detik.

## Kontrak OpenAPI

`docs/openapi.yaml` adalah sumber kontrak mesin. Jalankan:

```bash
npm run openapi:check
```

Pemeriksaan ini membandingkan file route dan method yang diekspor dengan `paths` di
OpenAPI, memastikan setiap `$ref` dapat di-resolve, dan memvalidasi parameter path.
`npm run build` menjalankannya lewat `prebuild`, sehingga drift kontrak menggagalkan build.

## Status penting

- Order: `PENDING -> PAID -> PROCESSING -> SHIPPED -> COMPLETED`, atau `CANCELLED`.
- Payment: `UNPAID -> PAID`, atau `FAILED`/`REFUNDED`; order kedaluwarsa setelah 24 jam.
- Konsultasi: `REQUESTED -> CONFIRMED -> COMPLETED`, atau `CANCELLED` sebelum selesai.
- Rekam medis hanya dibuat dokter setelah konsultasi `COMPLETED`.
- Artikel publik hanya `PUBLISHED` dan tidak terhapus.
- Ulasan baru/edit kembali `PENDING`; agregat publik hanya menghitung `APPROVED`.
- Verifikasi mitra: `PENDING`, `VERIFIED`, `REJECTED`; katalog publik hanya `VERIFIED`.

## Endpoint index

### Auth dan akun

| Method | Path                                | Sukses |
| ------ | ----------------------------------- | ------ |
| GET    | `/api/auth/csrf`                    | 200    |
| POST   | `/api/auth/callback/credentials`    | 302    |
| POST   | `/api/v1/auth/register`             | 201    |
| POST   | `/api/v1/auth/verify-email/request` | 200    |
| POST   | `/api/v1/auth/verify-email/confirm` | 200    |
| POST   | `/api/v1/auth/forgot-password`      | 200    |
| POST   | `/api/v1/auth/reset-password`       | 200    |
| GET    | `/api/v1/auth/me`                   | 200    |
| GET    | `/api/v1/users/me`                  | 200    |
| PATCH  | `/api/v1/users/me`                  | 200    |
| POST   | `/api/v1/users/me/change-password`  | 200    |

### Katalog publik

| Method | Path                        | Sukses |
| ------ | --------------------------- | ------ |
| GET    | `/api/v1/health`            | 200    |
| GET    | `/api/v1/openapi`           | 200    |
| GET    | `/api/v1/doctors`           | 200    |
| GET    | `/api/v1/doctors/{slug}`    | 200    |
| GET    | `/api/v1/facilities`        | 200    |
| GET    | `/api/v1/facilities/{slug}` | 200    |
| GET    | `/api/v1/articles`          | 200    |
| GET    | `/api/v1/articles/{slug}`   | 200    |
| GET    | `/api/v1/products`          | 200    |
| GET    | `/api/v1/products/{slug}`   | 200    |
| GET    | `/api/v1/search`            | 200    |

### Keranjang dan pesanan

| Method | Path                                | Sukses  |
| ------ | ----------------------------------- | ------- |
| GET    | `/api/v1/cart`                      | 200     |
| DELETE | `/api/v1/cart`                      | 200     |
| POST   | `/api/v1/cart/items`                | 200     |
| PATCH  | `/api/v1/cart/items/{id}`           | 200     |
| DELETE | `/api/v1/cart/items/{id}`           | 200     |
| GET    | `/api/v1/orders`                    | 200     |
| POST   | `/api/v1/orders`                    | 201     |
| GET    | `/api/v1/orders/{id}`               | 200     |
| POST   | `/api/v1/orders/{id}/cancel`        | 200     |
| POST   | `/api/v1/orders/{id}/payment`       | 200/201 |
| POST   | `/api/v1/payments/midtrans/webhook` | 200     |
| GET    | `/api/v1/cron/orders/expire`        | 200     |

### Konsultasi dan rekam medis

| Method | Path                                               | Sukses |
| ------ | -------------------------------------------------- | ------ |
| GET    | `/api/v1/consultations`                            | 200    |
| POST   | `/api/v1/consultations`                            | 201    |
| GET    | `/api/v1/consultations/{id}`                       | 200    |
| POST   | `/api/v1/consultations/{id}/cancel`                | 200    |
| GET    | `/api/v1/medical-records`                          | 200    |
| GET    | `/api/v1/medical-records/{id}`                     | 200    |
| GET    | `/api/v1/doctor/consultations`                     | 200    |
| GET    | `/api/v1/doctor/consultations/{id}`                | 200    |
| PATCH  | `/api/v1/doctor/consultations/{id}/status`         | 200    |
| PUT    | `/api/v1/doctor/consultations/{id}/medical-record` | 200    |

### Dokter, fasilitas, dan partner

| Method | Path                                   | Sukses |
| ------ | -------------------------------------- | ------ |
| GET    | `/api/v1/doctor/profile`               | 200    |
| PATCH  | `/api/v1/doctor/profile`               | 200    |
| GET    | `/api/v1/doctor/schedule`              | 200    |
| PUT    | `/api/v1/doctor/schedule`              | 200    |
| GET    | `/api/v1/facility/profile`             | 200    |
| PATCH  | `/api/v1/facility/profile`             | 200    |
| GET    | `/api/v1/facility/operating-hours`     | 200    |
| PUT    | `/api/v1/facility/operating-hours`     | 200    |
| GET    | `/api/v1/facility/products`            | 200    |
| POST   | `/api/v1/facility/products`            | 201    |
| GET    | `/api/v1/facility/products/{id}`       | 200    |
| PATCH  | `/api/v1/facility/products/{id}`       | 200    |
| DELETE | `/api/v1/facility/products/{id}`       | 200    |
| GET    | `/api/v1/facility/orders`              | 200    |
| GET    | `/api/v1/facility/orders/{id}`         | 200    |
| PATCH  | `/api/v1/facility/orders/{id}/status`  | 200    |
| POST   | `/api/v1/partner/doctor`               | 201    |
| POST   | `/api/v1/partner/facility`             | 201    |
| GET    | `/api/v1/partner/articles`             | 200    |
| POST   | `/api/v1/partner/articles`             | 201    |
| GET    | `/api/v1/partner/articles/{id}`        | 200    |
| PATCH  | `/api/v1/partner/articles/{id}`        | 200    |
| DELETE | `/api/v1/partner/articles/{id}`        | 200    |
| POST   | `/api/v1/partner/articles/{id}/submit` | 200    |

### Notifikasi, ulasan, upload, AI

| Method | Path                              | Sukses  |
| ------ | --------------------------------- | ------- |
| GET    | `/api/v1/notifications`           | 200     |
| PATCH  | `/api/v1/notifications/{id}/read` | 200     |
| POST   | `/api/v1/notifications/read-all`  | 200     |
| GET    | `/api/v1/reviews`                 | 200     |
| POST   | `/api/v1/reviews`                 | 201     |
| PATCH  | `/api/v1/reviews/{id}`            | 200     |
| DELETE | `/api/v1/reviews/{id}`            | 200     |
| POST   | `/api/v1/uploads/signature`       | 200     |
| GET    | `/api/v1/ai/status`               | 200     |
| POST   | `/api/v1/ai/chat`                 | 200/503 |

### Admin

| Method | Path                                             | Sukses |
| ------ | ------------------------------------------------ | ------ |
| GET    | `/api/v1/admin/users`                            | 200    |
| GET    | `/api/v1/admin/users/{id}`                       | 200    |
| PATCH  | `/api/v1/admin/users/{id}`                       | 200    |
| DELETE | `/api/v1/admin/users/{id}`                       | 200    |
| POST   | `/api/v1/admin/users/{id}/restore`               | 200    |
| GET    | `/api/v1/admin/doctors`                          | 200    |
| GET    | `/api/v1/admin/doctors/{id}`                     | 200    |
| PATCH  | `/api/v1/admin/doctors/{id}`                     | 200    |
| PATCH  | `/api/v1/admin/doctors/{id}/verification`        | 200    |
| GET    | `/api/v1/admin/facilities`                       | 200    |
| GET    | `/api/v1/admin/facilities/{id}`                  | 200    |
| PATCH  | `/api/v1/admin/facilities/{id}`                  | 200    |
| PATCH  | `/api/v1/admin/facilities/{id}/verification`     | 200    |
| GET    | `/api/v1/admin/orders`                           | 200    |
| GET    | `/api/v1/admin/consultations`                    | 200    |
| GET    | `/api/v1/admin/orders/{id}`                      | 200    |
| PATCH  | `/api/v1/admin/orders/{id}/status`               | 200    |
| GET    | `/api/v1/admin/articles`                         | 200    |
| POST   | `/api/v1/admin/articles`                         | 201    |
| GET    | `/api/v1/admin/articles/{id}`                    | 200    |
| PATCH  | `/api/v1/admin/articles/{id}`                    | 200    |
| DELETE | `/api/v1/admin/articles/{id}`                    | 200    |
| POST   | `/api/v1/admin/articles/{id}/moderate`           | 200    |
| POST   | `/api/v1/admin/articles/{id}/restore`            | 200    |
| GET    | `/api/v1/admin/reviews`                          | 200    |
| GET    | `/api/v1/admin/reviews/{id}`                     | 200    |
| PATCH  | `/api/v1/admin/reviews/{id}/moderate`            | 200    |
| GET    | `/api/v1/admin/audit-logs`                       | 200    |
| POST   | `/api/v1/admin/notifications/broadcast`          | 201    |
| GET    | `/api/v1/admin/stats`                            | 200    |
| GET    | `/api/v1/admin/system`                           | 200    |
| GET    | `/api/v1/admin/email-templates`                  | 200    |
| PUT    | `/api/v1/admin/email-templates/{key}/{audience}` | 200    |
| DELETE | `/api/v1/admin/email-templates/{key}/{audience}` | 200    |

## Akun uji panel

Untuk menguji login dan panel per peran tanpa menyentuh akun demo:

```bash
npm run db:seed:test
```

Kredensial dibaca dari `.env` (`TEST_DOCTOR_*`, `TEST_FACILITY_*`, `TEST_PHARMACY_*`,
`TEST_PATIENT_*`; contoh kunci di `.env.example`). Seed ini idempoten, memulihkan akun yang
dinonaktifkan, menolak jalan di production, dan membuat dokter serta fasilitas berstatus `VERIFIED`
(muncul di katalog publik). `TEST_FACILITY_*` adalah klinik (role `FACILITY`) dan
`TEST_PHARMACY_*` adalah apotek (role `PHARMACY`); hanya apotek yang punya menu pesanan dan produk.

## Fixtures demo deterministik

Jalankan:

```bash
npm run db:seed:demo
```

Seed memakai upsert berdasarkan unique key, jadi aman dijalankan berulang. Password semua
akun demo berasal dari `SEED_DEMO_PASSWORD` (default `Demo12345!`). Akun admin berasal dari
`npm run db:seed` dan memakai `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.

| Peran     | Email                | Identifier stabil    |
| --------- | -------------------- | -------------------- |
| Admin     | `SEED_ADMIN_EMAIL`   | -                    |
| Pasien    | `pasien@silk.local`  | -                    |
| Dokter    | `clara@silk.local`   | `dr-clara-anindita`  |
| Dokter    | `santika@silk.local` | `dr-santika-dewi`    |
| Fasilitas | `klinik@silk.local`  | `klinik-sehat-senja` |
| Farmasi   | `aposilk@silk.local` | `aposilk`            |

Produk stabil: `vitamin-harian-keluarga`, `susu-nutrisi-ibu-dan-anak`,
`perawatan-kulit-sensitif`, `tensimeter-digital`.

Artikel stabil: `kelelahan-berlebihan-meski-sudah-tidur`,
`tips-menjaga-kesehatan-mental-di-era-digital`,
`pentingnya-sarapan-pagi-untuk-produktivitas`,
`panduan-sederhana-menjaga-hidrasi-harian`.

Ulasan approved dengan ID stabil:

- `demo-review-doctor-clara` (5)
- `demo-review-doctor-santika` (5)
- `demo-review-facility-klinik` (4)
- `demo-review-facility-aposilk` (5)
- `demo-review-product-vitamin` (5)

Jadwal dokter demo: Senin–Jumat, `09:00–12:00` dan `13:00–17:00` (Asia/Jakarta).
Jam operasional fasilitas demo: Senin–Jumat `08:00–21:00`, Sabtu `08:00–18:00`, Minggu
tutup.

ID dokter/fasilitas/produk/artikel dibuat acak oleh database. Gunakan slug atau email
untuk menemukannya; jangan mengandalkan ID hasil seed. Ulasan memakai ID tetap.

Seed demo tidak membuat order, konsultasi, notifikasi, atau audit log. Untuk QA yang butuh
state bersih, gunakan database atau Neon branch terpisah, lalu jalankan `db:seed` dan
`db:seed:demo`.

## Integrasi yang belum aktif

- Midtrans: `MIDTRANS_SERVER_KEY` kosong membuat pembayaran `503`; jangan memanggil
  provider nyata tanpa kredensial.
- AI: `/api/v1/ai/chat` `503` sampai provider diimplementasikan.
- Email: tanpa `RESEND_API_KEY`/`EMAIL_FROM`, email dicetak ke console di development dan
  gagal di production.
- Cloudinary: tanpa kredensial, endpoint signature `503`.
- Cron: `CRON_SECRET` harus diisi untuk menguji endpoint cron secara end-to-end.
