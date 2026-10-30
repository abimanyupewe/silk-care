# Layanan fasilitas dan janji temu — desain

Tanggal: 2026-10-30. Status: menunggu review. Cakupan: spec 0 dari 6 (lihat "Di luar cakupan").

## Tujuan

Sembilan tipe fasilitas non-apotek (rumah sakit, klinik, laboratorium, fisioterapi, radiologi,
rumah duka, wellness, pijat, ambulans) saat ini hanya punya profil dan jam operasional. Fitur ini
memberi mereka:

1. katalog layanan (nama, deskripsi, harga) yang tampil publik, dan
2. permintaan janji temu dari pasien yang diterima atau ditolak fasilitas.

Keberhasilan: pemilik fasilitas non-apotek bisa mengelola layanan dan memproses janji temu dari
panelnya; pasien bisa melihat layanan di halaman fasilitas dan mengajukan janji temu pada
tanggal dan jam pilihannya, dalam jam operasional.

## Keputusan yang sudah diambil

- Katalog + permintaan janji temu, **tanpa** pembayaran online.
- Pasien mengusulkan tanggal dan jam bebas; API memvalidasi terhadap jam operasional (zona
  Jakarta). Tanpa slot atau kuota.
- Alur status meniru `Consultation` (`REQUESTED → CONFIRMED → COMPLETED`, `CANCELLED`). Penolakan
  oleh fasilitas = `CANCELLED` dengan `cancelReason`; tidak ada status `REJECTED` terpisah.
- Model baru berdiri sendiri; `Consultation` tidak diubah.

## Di luar cakupan (spec berikutnya, masing-masing siklus sendiri)

1. Slot dan kuota per layanan. 2. Pembayaran online. 3. Pengingat terjadwal. 4. Rekam medis/hasil
pemeriksaan fasilitas. 5. Alur khusus ambulans (permintaan darurat + lokasi jemput) dan rumah duka
(paket). Dua tipe terakhir sementara memakai katalog dan janji temu biasa. Titik sambung untuk
bagian 1 sampai 5: `scheduledAt`, `serviceId`, dan `status` pada `Appointment`.

## Data (Prisma, migrasi `facility_services_appointments`)

`FacilityService`
- `id`, `facilityId` (relasi `Facility`, cascade), `slug` (unik), `name`, `description?`
- `priceMin Int`, `priceMax Int?` (rupiah bulat; harga tetap = hanya `priceMin`)
- `durationMinutes Int @default(30)`, `active Boolean @default(true)`, `deletedAt DateTime?`
- `createdAt`, `updatedAt`; indeks `[facilityId, active]`

`Appointment`
- `id`, `patientId` (`User`, cascade), `facilityId` (`Facility`, restrict)
- `serviceId?` (`FacilityService`, set null) plus snapshot `serviceName String`, `price Int?`,
  `priceMax Int?` — seperti snapshot harga di `OrderItem`
- `status AppointmentStatus @default(REQUESTED)`: `REQUESTED | CONFIRMED | COMPLETED | CANCELLED`
- `scheduledAt DateTime`, `endsAt DateTime`, `durationMinutes Int`
- `notes String?` (dari pasien), `cancelReason String?`, `confirmedAt?`, `completedAt?`,
  `cancelledAt?`, `createdAt`, `updatedAt`
- indeks `[patientId, scheduledAt]`, `[facilityId, scheduledAt]`, `[status, scheduledAt]`

Enum tambahan: `AppointmentStatus`, `NotificationType.APPOINTMENT`,
`IdempotencyScope.APPOINTMENT_CREATE`. Tipe fasilitas sudah ada (`FacilityType`).

## Aturan bisnis

Pengajuan (`POST /appointments`):
- Fasilitas harus `VERIFIED`, bukan `PHARMACY`; layanan (bila ada) aktif, tidak terhapus, dan
  milik fasilitas itu. `serviceId` opsional agar fasilitas tanpa katalog tetap bisa menerima janji.
- `scheduledAt` harus di masa depan; hari dan jam (zona Asia/Jakarta, `getJakartaSchedulePosition`
  di `lib/consultation.ts`) harus dalam jam operasional, tidak `isClosed`, dan seluruh durasi
  (`scheduledAt` sampai `endsAt`) muat sebelum `closeTime`. Fasilitas tanpa jam operasional
  menolak pengajuan (422) dengan pesan jelas.
- Pasien tidak boleh punya janji `REQUESTED/CONFIRMED` yang tumpang tindih (semua fasilitas).
- Pengaju bukan pemilik fasilitas itu sendiri.
- Menerima `Idempotency-Key` (scope `APPOINTMENT_CREATE`); rate limit seperti pembuatan
  konsultasi.

Transisi status (mirip `consultation` routes):
- Fasilitas: `REQUESTED → CONFIRMED`, `CONFIRMED → COMPLETED` (hanya setelah `scheduledAt`),
  `REQUESTED|CONFIRMED → CANCELLED` (wajib `cancelReason`; ini juga "menolak").
- Pasien: `REQUESTED|CONFIRMED → CANCELLED`.
- Transisi lain: 409. Setiap perubahan menulis notifikasi `APPOINTMENT` ke pihak lawan dan
  mengirim email best-effort.

## API (semua dengan entri `docs/openapi.yaml`)

Mitra fasilitas (`requireFacility` + non-apotek; kebalikan dari `requireShopFacility`):
- `GET/POST /facility/services`, `GET/PATCH/DELETE /facility/services/[id]` (DELETE = soft-delete)
- `GET /facility/appointments` (filter `status`, tanggal, pagination), `GET /facility/appointments/[id]`,
  `PATCH /facility/appointments/[id]/status`

Pasien (`requireUser`):
- `POST /appointments`, `GET /appointments`, `GET /appointments/[id]`, `POST /appointments/[id]/cancel`

Publik:
- `GET /facilities/[slug]/services` (layanan aktif, fasilitas terverifikasi saja). Layanan juga
  ditambahkan ke `facilityDetailSelect`.

Admin:
- `GET /admin/appointments` (daftar read-only dengan filter, untuk audit).

Guard baru `requireServiceFacility()` di `lib/facility-guard.ts`. Select, label, dan validasi
jadwal di `lib/appointment.ts` dan `lib/facility-service.ts`; fungsi pengecekan jam operasional
dipisah dari `isWithinDoctorSchedule` agar tidak mengubah alur dokter.

## UI

- Panel fasilitas non-apotek: menu **Layanan** dan **Janji temu** (route group baru, kebalikan
  `(shop)`: apotek diarahkan ke Ringkasan). Kartu "Janji temu menunggu" di Ringkasan dan badge di
  menu. Komponen mengikuti `FacilityProducts` dan `FacilityOrders`; blok bersama admin dipakai
  ulang.
- Halaman publik fasilitas: daftar layanan dan tombol ajukan janji temu. Halaman fasilitas publik
  masih berisi konten hard-coded, jadi tombol ini bergantung pada pekerjaan menyambungkannya ke
  API; sebelum itu, pengajuan tersedia lewat API dan akan ditautkan dari panel pasien bila ada.
- Teks Indonesia, tanpa shadow/gradient, target sentuh 44px, status selalu ikon + label.

## Notifikasi dan email

- Notifikasi `APPOINTMENT` pada pengajuan, konfirmasi, penyelesaian, dan pembatalan.
- Kunci email baru di `lib/transaction-email.ts` (`APPOINTMENT_REQUEST`, `APPOINTMENT_STATUS`,
  `APPOINTMENT_CANCELLED`) dengan template bawaan seperti kunci konsultasi, termasuk daftar
  template admin.

## Kesalahan dan batas

- Respons error memakai `lib/api.ts` (`jsonError`, kode dari status). Semua route dibungkus
  `handleRouteError`.
- Pembuatan janji dan perubahan status berjalan dalam `prisma.$transaction` bersama notifikasi.
- Risiko diketahui: tanpa kuota, banyak pasien bisa meminta jam yang sama; fasilitas menyaring
  secara manual. Ini diselesaikan oleh spec slot/kuota.

## Pengujian dan verifikasi

Proyek belum punya kerangka tes. Verifikasi: `npm run lint && npm run typecheck`,
`npm run openapi:check`, `npm run build` (dev server dimatikan), lalu uji manual lewat akun demo
`klinik@silk.local` dan `pasien@silk.local`: layanan CRUD, pengajuan dalam dan luar jam buka,
tumpang tindih, idempotensi, setiap transisi status, dan 403 untuk apotek serta role lain.
Fixture demo (`db:seed:demo`) ditambah beberapa layanan untuk klinik demo.
