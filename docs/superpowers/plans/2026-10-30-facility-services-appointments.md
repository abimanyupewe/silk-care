# Layanan Fasilitas dan Janji Temu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fasilitas non-apotek mengelola katalog layanan dan memproses permintaan janji temu; pasien mengajukan janji temu pada tanggal dan jam pilihannya dalam jam operasional.

**Architecture:** Dua model Prisma baru (`FacilityService`, `Appointment`) dengan alur status meniru `Consultation`. Route API mengikuti anatomi di `CLAUDE.md` (guard → `parseJson` → Prisma `select` bersama → `jsonOk`), UI panel mengikuti `FacilityProducts`/`FacilityOrders`.

**Tech Stack:** Next.js 15 App Router, Prisma 7 + Neon, Zod, SWR (`useApiQuery`), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-10-30-facility-services-appointments-design.md`

## Global Constraints

- Tanpa pembayaran, slot, kuota, pengingat, rekam medis, atau alur ambulans/rumah duka.
- Status: `REQUESTED | CONFIRMED | COMPLETED | CANCELLED`. Penolakan = `CANCELLED` + `cancelReason`; tidak ada `REJECTED`.
- Validasi waktu di zona `Asia/Jakarta` lewat `getJakartaSchedulePosition` (`lib/consultation.ts`); `Consultation` dan `isWithinDoctorSchedule` tidak diubah.
- Fasilitas `PHARMACY` ditolak (403 di sisi mitra, 404/422 di sisi pasien); non-apotek ditolak di route produk/pesanan seperti sekarang.
- Menambah/mengubah route atau method wajib diikuti `docs/openapi.yaml`; `npm run openapi:check` harus lolos.
- Teks UI dan komentar bahasa Indonesia; tanpa shadow/gradient; target sentuh ≥44px; teks ≥14px; status = ikon + label.
- Proyek tidak punya kerangka tes. Verifikasi tiap task: `npm run lint && npm run typecheck`, `npm run openapi:check` bila route berubah, plus pemeriksaan manual yang disebut. Jangan jalankan `npm run format` untuk seluruh repo (pernah mengubah 13 file tak terkait); format hanya file yang disentuh: `npx prettier --write <file...>`.
- `npm run build` hanya dengan dev server mati.

## Review Focus

- Janji yang melewati `closeTime` (mulai 16.45, durasi 30 menit, tutup 17.00) → 422.
- Waktu dekat tengah malam: `2026-11-02T17:30:00Z` adalah Selasa 00.30 Jakarta, bukan Senin → hari dan jam dihitung dari Jakarta.
- Fasilitas tanpa jam operasional atau hari `isClosed` → 422 dengan pesan jelas.
- `serviceId` milik fasilitas lain, tidak aktif, atau soft-deleted → 422/404, tidak pernah tersimpan.
- Replay `Idempotency-Key` dengan payload berbeda → 409; payload sama → 201 `Idempotent-Replayed: true`, tanpa janji ganda.
- Pasien yang juga pemilik fasilitas itu mengajukan ke fasilitasnya sendiri → ditolak.

Tiap baris ditempatkan sebagai pemeriksaan manual di task pemiliknya (Task 5 dan 6).

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `prisma/schema.prisma` + migrasi | Model/enum baru |
| `lib/facility-types.ts` | `isServiceFacility` |
| `lib/facility-guard.ts` | `requireServiceFacility` |
| `lib/facility-service.ts` | Select layanan, slug unik |
| `lib/appointment.ts` | Status, label, select, `isWithinOperatingHours` |
| `lib/transaction-email.ts`, `lib/email-templates.ts` | Email + template `APPOINTMENT_*` |
| `app/api/v1/facility/services/**`, `facility/appointments/**` | API mitra |
| `app/api/v1/appointments/**` | API pasien |
| `app/api/v1/facilities/[slug]/services/route.ts` | API publik |
| `app/api/v1/admin/appointments/route.ts` | Daftar admin |
| `components/facility/FacilityServices.tsx`, `FacilityAppointments.tsx` | UI panel |
| `app/dashboard/fasilitas/(service)/**` | Halaman + guard non-apotek |

---

### Task 1: Skema, enum, dan migrasi

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_facility_services_appointments/migration.sql` (dihasilkan Prisma)

**Interfaces:**
- Produces: model `FacilityService`, `Appointment`; enum `AppointmentStatus`; `NotificationType.APPOINTMENT`; `IdempotencyScope.APPOINTMENT_CREATE`; relasi balik `Facility.services`, `Facility.appointments`, `User.appointments`.

- [ ] **Step 1:** Tambahkan ke `prisma/schema.prisma` persis seperti bagian "Data" spec: `FacilityService` (`id`, `facilityId`, `slug @unique`, `name`, `description?`, `priceMin Int`, `priceMax Int?`, `durationMinutes Int @default(30)`, `active @default(true)`, `deletedAt?`, timestamps, `@@index([facilityId, active])`) dan `Appointment` (field, relasi `onDelete`, dan tiga indeks sesuai spec). Relasi `patient` memakai nama relasi `"PatientAppointments"`.
- [ ] **Step 2:** Tambahkan `APPOINTMENT` ke `NotificationType` dan `APPOINTMENT_CREATE` ke `IdempotencyScope`.
- [ ] **Step 3:** Jalankan `npm run db:migrate -- --name facility_services_appointments` (database lokal; jangan `db:push`). Expected: migrasi baru dibuat dan diterapkan, client digenerate.
- [ ] **Step 4:** Jalankan `npm run typecheck`. Expected: lolos.
- [ ] **Step 5:** Commit `feat(db): add facility services and appointments models`.

---

### Task 2: Helper lib dan guard

**Files:**
- Modify: `lib/facility-types.ts`, `lib/facility-guard.ts`
- Create: `lib/facility-service.ts`, `lib/appointment.ts`

**Interfaces:**
- Produces:
  - `isServiceFacility(typeOrRole: string | null | undefined): boolean` — true untuk tipe/role selain `PHARMACY` yang bukan kosong (role `FACILITY` atau salah satu dari 9 tipe).
  - `requireServiceFacility(): Promise<FacilityAuthResult>` — memanggil `requireFacility()`, 403 `Fitur ini hanya tersedia untuk fasilitas non-apotek.` bila role `PHARMACY`.
  - `facilityServiceSelect`, `publicFacilityServiceSelect` (tanpa `deletedAt`/`facilityId`), `createUniqueFacilityServiceSlug(name: string): Promise<string>` di `lib/facility-service.ts` (meniru `createUniqueProductSlug` di `lib/product.ts`).
  - Di `lib/appointment.ts`: `appointmentStatuses` (tuple), `appointmentStatusLabels: Record<…, string>`, `appointmentListSelect`, `appointmentDetailSelect`, dan `isWithinOperatingHours({ dayOfWeek, minutes, durationMinutes, hours }): boolean` dengan `hours: Array<{ dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean }>` — true bila ada jam hari itu, tidak `isClosed`, `openTime`/`closeTime` terisi, dan `minutes >= open && minutes + durationMinutes <= close` (pakai `timeToMinutes`).
- Consumes: `getJakartaSchedulePosition`, `timeToMinutes` dari `lib/consultation.ts`.

- [ ] **Step 1:** Konfirmasi konvensi `dayOfWeek` di `FacilityOperatingHour` sama dengan `getJakartaSchedulePosition` (1=Senin … 7=Minggu) dengan membaca `lib/schedule.ts`; bila berbeda, sesuaikan di `isWithinOperatingHours` dan catat di komentar satu baris.
- [ ] **Step 2:** Tambahkan `isServiceFacility` dan `requireServiceFacility` sesuai Interfaces.
- [ ] **Step 3:** Buat `lib/facility-service.ts` dan `lib/appointment.ts` sesuai Interfaces. `appointmentListSelect` memuat `id, status, scheduledAt, endsAt, durationMinutes, serviceName, price, priceMax, notes, cancelReason` plus `facility { name, slug }` dan `patient { name }`; `appointmentDetailSelect` menambah timestamp status dan `patient.email`.
- [ ] **Step 4:** Verifikasi `npm run lint && npm run typecheck` lolos.
- [ ] **Step 5:** Commit `feat(facility): add service and appointment helpers`.

---

### Task 3: API layanan mitra

**Files:**
- Create: `app/api/v1/facility/services/route.ts`, `app/api/v1/facility/services/[id]/route.ts`
- Modify: `docs/openapi.yaml`

**Interfaces:**
- Consumes: `requireServiceFacility`, `facilityServiceSelect`, `createUniqueFacilityServiceSlug`.
- Produces: `GET/POST /facility/services` (GET: `q`, `active`, pagination 20), `GET/PATCH/DELETE /facility/services/[id]`. Skema Zod: `name` 2–150, `description` ≤2000 nullable, `priceMin` int 0–100_000_000, `priceMax` int nullable dan wajib ≥ `priceMin` (refine, 422), `durationMinutes` int 5–480, `active` boolean. DELETE = soft-delete (`active:false`, `deletedAt`) seperti produk.

- [ ] **Step 1:** Tulis dua route mengikuti `app/api/v1/facility/products/route.ts` dan `[id]/route.ts` (anatomi sama, `where` selalu menyertakan `facilityId` dan `deletedAt: null`).
- [ ] **Step 2:** Tambahkan path, method, dan skema ke `docs/openapi.yaml`.
- [ ] **Step 3:** Jalankan `npm run lint && npm run typecheck && npm run openapi:check`. Expected: semua lolos.
- [ ] **Step 4:** Manual (dev server, login `klinik@silk.local`): buat layanan, `priceMax < priceMin` → 422; login `aposilk@silk.local` → 403 di semua method.
- [ ] **Step 5:** Commit `feat(facility): add service catalog endpoints`.

---

### Task 4: API layanan publik

**Files:**
- Create: `app/api/v1/facilities/[slug]/services/route.ts`
- Modify: `lib/catalog.ts` (`facilityDetailSelect`), `docs/openapi.yaml`

**Interfaces:**
- Consumes: `publicFacilityWhere`, `publicFacilityServiceSelect`.
- Produces: `GET /facilities/[slug]/services` → `{ data: Service[] }` (aktif, `deletedAt: null`, urut `name`); 404 bila fasilitas tak terverifikasi/tak ada. `facilityDetailSelect` menambah `services` dengan filter dan select yang sama.

- [ ] **Step 1:** Tulis route dan tambahkan `services` ke `facilityDetailSelect`; `publicFacilityWhere` tidak diubah.
- [ ] **Step 2:** Perbarui `docs/openapi.yaml` (path baru; skema `Facility` mendapat `services`).
- [ ] **Step 3:** Jalankan lint, typecheck, `openapi:check`.
- [ ] **Step 4:** Manual: layanan nonaktif/terhapus tidak muncul; slug fasilitas belum terverifikasi → 404; detail fasilitas ikut memuat `services`.
- [ ] **Step 5:** Commit `feat(catalog): expose facility services`.

---

### Task 5: API janji temu pasien (+ email dan notifikasi)

**Files:**
- Create: `app/api/v1/appointments/route.ts`, `appointments/[id]/route.ts`, `appointments/[id]/cancel/route.ts`
- Modify: `lib/transaction-email.ts`, `lib/email-templates.ts`, `docs/openapi.yaml`

**Interfaces:**
- Consumes: `requireUser()` (sesuai spec; semua rute `/appointments*` hanya memproses baris milik `auth.user.id`), `resolveIdempotency`/`createIdempotencyRecord`/`completeIdempotencyRecord`/`replayIdempotency`/`isIdempotencyUniqueError` (scope `'APPOINTMENT_CREATE'`), `rateLimit(\`appointments:create:${userId}\`, 10, 10*60*1000)`, `isWithinOperatingHours`, `getJakartaSchedulePosition`.
- Produces:
  - `POST /appointments` body `{ facilitySlug: string; serviceId?: string; scheduledAt: Date; notes?: string ≤1000 }` → 201 `appointmentDetailSelect`. `durationMinutes` = layanan.`durationMinutes` atau 30 bila tanpa layanan. Urutan validasi: body → idempotensi → rate limit → `scheduledAt` ≥ 15 menit ke depan (422) → fasilitas (`publicFacilityWhere`, bukan `PHARMACY`, bukan milik pengaju; 404/422) → layanan (milik fasilitas, aktif, `deletedAt: null`; 422) → jam operasional (422, pesan terpisah untuk "belum ada jam operasional" dan "di luar jam operasional") → tumpang tindih pasien pada `REQUESTED|CONFIRMED` (409) → transaksi: buat janji (snapshot `serviceName` = nama layanan atau `Janji temu`, `price`, `priceMax`), notifikasi `APPOINTMENT` ke pemilik fasilitas, selesaikan catatan idempotensi.
  - `GET /appointments` (pasien sendiri, filter `status`, pagination 20), `GET /appointments/[id]`, `POST /appointments/[id]/cancel` (body `{ reason?: string ≤500 }`; hanya `REQUESTED|CONFIRMED`, selain itu 409; menulis notifikasi ke pemilik fasilitas dan email).
  - `sendAppointmentRequestEmail({ to, name, patientName, serviceName, scheduledAt })` (audience `FACILITY`, key `APPOINTMENT_REQUEST`), `sendAppointmentStatusEmail({ to, name, facilityName, scheduledAt, status, note })` (audience `PATIENT`, key `APPOINTMENT_STATUS`), `sendAppointmentCancelledToFacilityEmail({ to, name, patientName, scheduledAt, reason })` (audience `FACILITY`, key `APPOINTMENT_CANCELLED`) di `lib/transaction-email.ts`; entri template dengan kunci yang sama, grup `Janji temu`, meniru entri `CONSULTATION_*` di `lib/email-templates.ts`.

- [ ] **Step 1:** Tulis tiga entri template dan tiga fungsi email sesuai Interfaces, meniru pola `CONSULTATION_*`.
- [ ] **Step 2:** Tulis `POST/GET /appointments` mengikuti `app/api/v1/consultations/route.ts` (urutan validasi di atas; tanpa `AuditLog`, spec tidak mewajibkannya).
- [ ] **Step 3:** Tulis `[id]` dan `cancel` mengikuti `app/api/v1/consultations/[id]/route.ts` dan `cancel/route.ts`.
- [ ] **Step 4:** Perbarui `docs/openapi.yaml`.
- [ ] **Step 5:** Jalankan lint, typecheck, `openapi:check`.
- [ ] **Step 6:** Manual (login `pasien@silk.local`, panggil lewat `fetch` di konsol browser; `klinik@silk.local` harus punya jam operasional dan satu layanan aktif):
  - jam operasional 09.00–17.00 → mulai 16.45 durasi 30 menit ditolak 422; 16.30 diterima;
  - `scheduledAt` `2026-11-02T17:30:00Z` (Selasa 00.30 Jakarta) ditolak 422, bukan dihitung sebagai Senin;
  - hari `isClosed` dan fasilitas tanpa jam operasional → 422 dengan pesan berbeda;
  - `serviceId` layanan fasilitas lain, nonaktif, atau terhapus → 422;
  - `Idempotency-Key` sama + payload sama → 201 dengan `Idempotent-Replayed: true` dan hanya satu baris; payload beda → 409;
  - dua janji tumpang tindih → 409; fasilitas `PHARMACY` ditolak; pemilik fasilitas mengajukan ke fasilitasnya sendiri ditolak.
- [ ] **Step 7:** Commit `feat(appointments): add patient appointment endpoints`.

---

### Task 6: API janji temu mitra dan daftar admin

**Files:**
- Create: `app/api/v1/facility/appointments/route.ts`, `facility/appointments/[id]/route.ts`, `facility/appointments/[id]/status/route.ts`, `app/api/v1/admin/appointments/route.ts`
- Modify: `docs/openapi.yaml`

**Interfaces:**
- Consumes: `requireServiceFacility`, `requireRole(['ADMIN'])`, `appointmentListSelect`, `appointmentDetailSelect`, `sendAppointmentStatusEmail`.
- Produces:
  - `GET /facility/appointments` (filter `status`, `from`/`to` tanggal ISO pada `scheduledAt`, pagination 20), `GET /facility/appointments/[id]`.
  - `PATCH /facility/appointments/[id]/status` body `{ status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'; reason?: string ≤500 }`. Aturan: `CONFIRMED` hanya dari `REQUESTED`; `COMPLETED` hanya dari `CONFIRMED` dan hanya bila `scheduledAt` ≤ sekarang (409); `CANCELLED` dari `REQUESTED|CONFIRMED` dan wajib `reason` (422). Mengisi `confirmedAt`/`completedAt`/`cancelledAt`+`cancelReason`; notifikasi `APPOINTMENT` ke pasien dalam transaksi yang sama; email setelahnya. Meniru `app/api/v1/doctor/consultations/[id]/status/route.ts`.
  - `GET /admin/appointments` (filter `status`, `facilityId`, `from`/`to`, pagination 20), hanya baca.

- [ ] **Step 1:** Tulis tiga route mitra dan satu route admin.
- [ ] **Step 2:** Perbarui `docs/openapi.yaml`.
- [ ] **Step 3:** Jalankan lint, typecheck, `openapi:check`.
- [ ] **Step 4:** Manual: login `klinik@silk.local` → konfirmasi janji dari Task 5; selesaikan sebelum waktunya → 409; batalkan tanpa `reason` → 422; transisi tak sah → 409; pasien menerima notifikasi `APPOINTMENT`; janji fasilitas lain → 404; `aposilk@silk.local` → 403; `GET /admin/appointments` hanya untuk ADMIN.
- [ ] **Step 5:** Commit `feat(facility): add appointment management endpoints`.

---

### Task 7: UI panel fasilitas non-apotek

**Files:**
- Create: `components/facility/FacilityServices.tsx`, `components/facility/FacilityAppointments.tsx`, `app/dashboard/fasilitas/(service)/layout.tsx`, `(service)/layanan/page.tsx`, `(service)/janji-temu/page.tsx`
- Modify: `components/facility/FacilityShell.tsx`, `components/facility/FacilityDashboard.tsx`, `app/dashboard/fasilitas/notifikasi/page.tsx`

**Interfaces:**
- Consumes: `/facility/services*`, `/facility/appointments*` (Task 3 dan 6), `isServiceFacility`, `appointmentStatusLabels`, `formatAdminCurrency`, `formatAdminDateTime`, blok admin bersama (`AdminPageHeader`, `AdminTableSkeleton`, `AdminEmptyState`, `AdminErrorState`).
- Produces: rute `/dashboard/fasilitas/layanan` dan `/dashboard/fasilitas/janji-temu`; badge menu Janji temu (jumlah `REQUESTED` via `/facility/appointments?status=REQUESTED&limit=1`, `meta.total`).

- [ ] **Step 1:** Buat `(service)/layout.tsx` kebalikan `(shop)/layout.tsx`: `getActiveSession()`, apotek (`PHARMACY`) diarahkan ke `/dashboard/fasilitas`.
- [ ] **Step 2:** Tulis `FacilityServices` mengikuti `FacilityProducts` (daftar, tambah/ubah, aktif/nonaktif, hapus dengan konfirmasi, tampilkan harga `priceMin`–`priceMax` dengan `formatAdminCurrency`) dan `FacilityAppointments` mengikuti `FacilityOrders` (filter status, kartu per janji, tombol Konfirmasi / Selesai / Batalkan dengan input alasan wajib untuk batal; status memakai ikon + label).
- [ ] **Step 3:** Di `FacilityShell`, tambahkan item Layanan (ikon `ClipboardList`) dan Janji temu (ikon `CalendarCheck`) hanya untuk `isServiceFacility(role)`, dan badge janji temu menunggu. Di `FacilityDashboard`, tambahkan kartu "Janji temu menunggu" untuk non-apotek (apotek tetap hanya kartu pesanan). Tambahkan `APPOINTMENT: { href: '/dashboard/fasilitas/janji-temu', label: 'Lihat janji temu' }` ke `links` di halaman notifikasi.
- [ ] **Step 4:** Jalankan `npx prettier --write` pada file yang disentuh, lalu lint dan typecheck.
- [ ] **Step 5:** Manual di browser: `klinik@silk.local` melihat dua menu baru dan kartu; `aposilk@silk.local` tidak melihatnya dan membuka URL-nya langsung dialihkan ke Ringkasan; lebar mobile tidak ada scroll horizontal; tur driver.js tetap jalan.
- [ ] **Step 6:** Commit `feat(facility): add services and appointments panel pages`.

---

### Task 8: Seed demo, dokumentasi, verifikasi akhir

**Files:**
- Modify: `prisma/seed-demo.*` (cari lewat `grep -rn "klinik@silk.local" prisma`), `docs/API.md`, `AGENTS.md`

**Interfaces:**
- Consumes: model dan route dari Task 1–7.

- [ ] **Step 1:** Tambahkan 3 layanan demo untuk klinik demo ke seed (upsert berdasarkan `slug` unik, aman diulang) dan pastikan klinik demo punya jam operasional.
- [ ] **Step 2:** Perbarui `docs/API.md` (indeks endpoint, fixture demo) dan `AGENTS.md` (daftar route, bagian "Database": migrasi `facility_services_appointments`, aturan janji temu dan batasan non-apotek).
- [ ] **Step 3:** Jalankan `npm run db:seed:demo`; expected: selesai tanpa error dan dua kali jalan tidak menggandakan layanan.
- [ ] **Step 4:** Matikan dev server, jalankan `npm run lint && npm run typecheck && npm run build`. Expected: semua lolos (`prebuild` menjalankan `openapi:check`).
- [ ] **Step 5:** Commit `docs: document facility services and appointments`.
