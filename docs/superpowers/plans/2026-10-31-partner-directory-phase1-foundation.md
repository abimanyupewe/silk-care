# Direktori Mitra — Fase 1 (Fondasi) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mitra mendaftar lewat form bertahap per tipe, langsung tayang dengan masa gratis 6 bulan, katalog publik hanya menampilkan mitra berlangganan aktif, dan fitur transaksi dimatikan.

**Architecture:** Registry deklaratif (`lib/partner-requirements/`) menjadi satu sumber untuk form, skema Zod, dan penyimpanan `details`/`internalDetails`. Langganan disimpan sebagai `Subscription.endsAt`; tampil/tidaknya dihitung dari `endsAt > now` lewat satu helper where. Satu sakelar `transactionsEnabled` mematikan toko, janji temu, dan konsultasi.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Prisma 7 + Neon, Zod, Auth.js v5. Tanpa kerangka tes: logika murni dicek dengan skrip `assert` yang dijalankan `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-31-partner-directory-subscription-design.md`

**Fase lain:** Fase 2 (Duitku, panel langganan, admin harga) dan Fase 3 (peta, halaman detail) mendapat plan sendiri setelah Fase 1 selesai. Fase 1 sengaja memuat seluruh tabel langganan agar skema tidak berubah antarfase.

## Global Constraints

- Branch baru dari `staging` (repo sudah di `staging`). **Jangan commit atau stage apa pun** kecuali pengguna memintanya; karena itu plan ini tidak punya langkah commit.
- Prettier hanya untuk berkas yang disentuh (`npx prettier --write <berkas>`), bukan `npm run format`.
- Semua teks UI, komentar, dan dokumen berbahasa Indonesia; identifier berbahasa Inggris.
- Masa gratis: 6 bulan kalender sejak mendaftar (`FREE_TRIAL`). Mitra baru langsung `VERIFIED`.
- Tampil di publik jika dan hanya jika `Subscription.endsAt > now` dan `User.deletedAt = null`. `internalDetails` tidak boleh ada di select publik mana pun.
- Setiap rute baru atau berubah mengikuti anatomi di `CLAUDE.md` (`try/catch` + `handleRouteError`, guard dulu, `parseJson`, `jsonOk`/`jsonCreated`/`jsonError`) dan memperbarui `docs/openapi.yaml`.
- Field per tipe adalah **draf**; tandai `draft: true` di registry dan jangan sebut sebagai syarat resmi.
- Tidak boleh ada klien yang menyimpan password di `localStorage`/`sessionStorage`.
- Setelah tiap task: `npm run lint && npm run typecheck`. `npm run build` hanya dengan dev server mati.

## Review Focus

1. Langganan berakhir persis pada `endsAt` (`now == endsAt`): mitra sudah tidak tampil (`gt`, bukan `gte`). Diuji di Task 3.
2. `addMonths` pada 31 Agustus/30 Agustus/29 Februari: hasil dibatasi akhir bulan, tidak melompat ke bulan berikutnya. Diuji di Task 2.
3. `internalDetails` (mis. nomor STR) tidak muncul di respons publik daftar, detail, maupun pencarian. Diuji di Task 8.
4. Kirim ganda form pendaftaran atau pendaftaran oleh akun yang sudah punya profil: tepat satu profil dan satu `Subscription`, tanpa akun ganda. Diuji di Task 7 dan 9.
5. `?type=` tak dikenal atau koordinat di luar rentang: tipe diabaikan dan koordinat ditolak `422`, bukan `500`. Diuji di Task 6, 7, dan 9.

---

## File Structure

| Berkas                                                                      | Tanggung jawab                                                       |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `prisma/schema.prisma`, `prisma/migrations/*_partner_subscriptions/`        | Tabel langganan, kolom `details`/`internalDetails`, indeks koordinat |
| `lib/months.ts`                                                             | `addMonths` murni                                                    |
| `lib/subscription.ts`                                                       | `activeSubscriptionWhere`, `computeEndsAt`, `startTrial`             |
| `lib/catalog.ts`                                                            | Filter publik `*WhereAt(now)`, select publik membawa `details`       |
| `lib/features.ts`                                                           | Sakelar `transactionsEnabled`                                        |
| `lib/transactions-guard.ts`                                                 | `requireTransactions()` → `503`                                      |
| `lib/partner-requirements/{types,blocks,partners,schema,index}.ts`          | Registry dan pembuat skema                                           |
| `app/api/v1/partner/registrations/route.ts`                                 | Pendaftaran mitra tunggal                                            |
| `components/partner/{RequirementFields,PartnerRegisterForm}.tsx`            | Renderer field dan form bertahap                                     |
| `app/mitra/daftar/page.tsx`, `app/mitra/fasilitas/page.tsx`, `lib/roles.ts` | Pintu pendaftaran tunggal                                            |
| `scripts/checks/*.check.ts`                                                 | Skrip cek berbasis `assert`                                          |
| `prisma/seed-demo.ts`, `prisma/seed-test.ts`                                | Langganan aktif, `details`, koordinat                                |

---

### Task 1: Skema dan migrasi

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_partner_subscriptions/migration.sql` (dihasilkan Prisma)

**Interfaces:**

- Produces: model `Subscription`, `SubscriptionPayment`, `SubscriptionPrice`; enum `SubscriptionPlan`; kolom `details Json?` dan `internalDetails Json?` pada `Facility` dan `DoctorProfile`; relasi `User.subscription`.

- [ ] **Step 1: Buat branch.** `git switch -c feat/partner-directory`. Expected: branch aktif `feat/partner-directory`, working tree hanya berisi spec dan plan.
- [ ] **Step 2: Tambahkan skema persis seperti bagian "Model data" di spec** (tiga model, satu enum, `Subscription` ↔ `User` dengan `onDelete: Cascade`), `details Json?`, `internalDetails Json?`, dan `@@index([latitude, longitude])` pada `Facility` dan `DoctorProfile`; tambahkan `subscription Subscription?` pada `User`.
- [ ] **Step 3: Validasi.** Run: `npx prisma validate`. Expected: `The schema ... is valid`.
- [ ] **Step 4: Buat migrasi.** Run: `npm run db:migrate -- --name partner_subscriptions`. Expected: migrasi dibuat dan diterapkan ke database lokal; `npm run db:generate` selesai tanpa error.
- [ ] **Step 5: Typecheck.** Run: `npm run typecheck`. Expected: lulus.

### Task 2: `addMonths`

**Files:**

- Create: `lib/months.ts`, `scripts/checks/months.check.ts`

**Interfaces:**

- Produces: `addMonths(date: Date, months: number): Date` — menambah bulan kalender UTC; jika hari asal tidak ada di bulan tujuan, dibatasi ke hari terakhir bulan itu; jam/menit/detik dipertahankan.

- [ ] **Step 1: Tulis cek yang gagal** di `scripts/checks/months.check.ts` dengan `node:assert/strict`:
  - `addMonths(new Date('2026-08-31T10:00:00Z'), 6)` → `2027-02-28T10:00:00Z`
  - `addMonths(new Date('2027-08-31T10:00:00Z'), 6)` → `2028-02-29T10:00:00Z`
  - `addMonths(new Date('2026-01-31T00:00:00Z'), 1)` → `2026-02-28T00:00:00Z`
  - `addMonths(new Date('2026-10-31T00:00:00Z'), 12)` → `2027-10-31T00:00:00Z`
  - `addMonths(new Date('2026-11-15T00:00:00Z'), 3)` → `2027-02-15T00:00:00Z`
- [ ] **Step 2: Jalankan, pastikan gagal.** Run: `npx tsx scripts/checks/months.check.ts`. Expected: error modul `lib/months` tidak ditemukan.
- [ ] **Step 3: Implementasikan `addMonths` di `lib/months.ts`.** Hitung bulan/tahun tujuan dengan `Date.UTC`, lalu batasi hari ke `new Date(Date.UTC(y, m + 1, 0)).getUTCDate()`.
- [ ] **Step 4: Jalankan, pastikan lulus.** Run: `npx tsx scripts/checks/months.check.ts`. Expected: keluar dengan kode 0.

### Task 3: Helper langganan

**Files:**

- Create: `lib/subscription.ts`, `scripts/checks/subscription.check.ts`

**Interfaces:**

- Consumes: `addMonths` (Task 2); `Prisma` dari `@/lib/generated/prisma`.
- Produces:
  - `TRIAL_MONTHS = 6`
  - `activeSubscriptionWhere(now: Date): { deletedAt: null; subscription: { is: { endsAt: { gt: Date } } } }` — dipakai di atas `user: {...}`.
  - `computeEndsAt(currentEndsAt: Date | null, now: Date, durationMonths: number): Date` — `addMonths(max(now, currentEndsAt ?? now), durationMonths)`.
  - `startTrial(tx: Prisma.TransactionClient, userId: string, now: Date): Promise<void>` — membuat `Subscription` plan `FREE_TRIAL`, `endsAt = addMonths(now, TRIAL_MONTHS)`.

- [ ] **Step 1: Tulis cek yang gagal** di `subscription.check.ts`:
  - `computeEndsAt(null, 2026-10-31, 12)` → `2027-10-31`.
  - Perpanjangan sebelum habis: `computeEndsAt(2027-01-15, 2026-12-01, 12)` → `2028-01-15`.
  - Perpanjangan setelah habis: `computeEndsAt(2026-01-01, 2026-12-01, 12)` → `2027-12-01`.
  - Batas: `activeSubscriptionWhere(now).subscription.is.endsAt` memakai kunci `gt` (bukan `gte`) dan nilainya `now`.
- [ ] **Step 2: Jalankan, pastikan gagal.** Run: `npx tsx scripts/checks/subscription.check.ts`. Expected: modul tidak ditemukan.
- [ ] **Step 3: Implementasikan ketiganya di `lib/subscription.ts`.** `lib/subscription.ts` tidak memakai `server-only` agar cek `tsx` bisa mengimpornya; `startTrial` hanya menerima `tx` dari pemanggil.
- [ ] **Step 4: Jalankan, pastikan lulus.** Run: `npx tsx scripts/checks/subscription.check.ts`. Expected: kode 0.

### Task 4: Filter katalog bertanggal

**Files:**

- Modify: `lib/catalog.ts`, `lib/reviews.ts`, `app/api/v1/{doctors,facilities,products}/route.ts`, `app/api/v1/{doctors,facilities,products}/[slug]/route.ts`, `app/api/v1/facilities/[slug]/services/route.ts`, `app/api/v1/search/route.ts`, `app/api/v1/cart/items/route.ts`, `app/api/v1/consultations/route.ts`, `app/api/v1/appointments/route.ts`

**Interfaces:**

- Consumes: `activeSubscriptionWhere` (Task 3).
- Produces: `publicDoctorWhereAt(now: Date)`, `publicFacilityWhereAt(now: Date)`, `publicProductWhereAt(now: Date)` mengembalikan tipe where yang sama seperti konstanta lama ditambah syarat langganan. Konstanta `publicDoctorWhere`, `publicFacilityWhere`, `publicProductWhere` **dihapus**.

- [ ] **Step 1: Ganti konstanta menjadi fungsi** di `lib/catalog.ts` dengan nama baru; `publicProductWhereAt` memakai `facility: { verificationStatus: 'VERIFIED', user: activeSubscriptionWhere(now) }`.
- [ ] **Step 2: Perbarui semua pemanggil** (daftar di Files) dengan `...publicXWhereAt(new Date())`. Satu `new Date()` per permintaan.
- [ ] **Step 3: Pastikan tak ada sisa.** Run: `grep -rnE "publicDoctorWhere\b|publicFacilityWhere\b|publicProductWhere\b" app lib components`. Expected: tidak ada keluaran.
- [ ] **Step 4: Typecheck dan lint.** Run: `npm run lint && npm run typecheck`. Expected: lulus.
- [ ] **Step 5: Verifikasi manual** butuh data seed, jadi dijalankan di Task 10 Step 3.

### Task 5: Sakelar transaksi

**Files:**

- Create: `lib/features.ts`, `lib/transactions-guard.ts`
- Modify: `lib/facility-types.ts`, `components/doctor/DoctorShell.tsx`, ringkasan dokter (cari kartu konsultasi dengan `grep -rn "konsultasi" components/doctor`), `app/api/v1/{cart/items,orders,consultations,appointments}/route.ts`, `app/api/v1/orders/[id]/payment/route.ts`, `app/api/v1/search/route.ts`, `docs/openapi.yaml`

**Interfaces:**

- Produces:
  - `transactionsEnabled: boolean` (= `false`) di `lib/features.ts` (tanpa impor server).
  - `requireTransactions(): Response | null` di `lib/transactions-guard.ts` — mengembalikan `jsonError('Fitur ini sedang tidak tersedia.', 503)` saat sakelar mati, selain itu `null`.

- [ ] **Step 1: Buat kedua berkas.** Sakelar adalah konstanta; guard memakai `jsonError` dari `lib/api.ts`.
- [ ] **Step 2: `isShopFacility` dan `isServiceFacility`** mengembalikan `false` bila `!transactionsEnabled`, sehingga `FacilityShell`, `FacilityDashboard`, layout `(shop)`/`(service)` dan `lib/facility-guard.ts` ikut mati.
- [ ] **Step 3: Sembunyikan konsultasi** di `DoctorShell` (item nav dan query badge) dan di ringkasan dokter bila sakelar mati.
- [ ] **Step 4: Pasang `requireTransactions()`** sebagai pemeriksaan pertama setelah guard auth pada: `POST /cart/items`, `POST /orders`, `POST /orders/{id}/payment`, `POST /consultations`, `POST /appointments`. Jangan menyentuh rute pembatalan, rute baca, webhook Midtrans, dan cron.
- [ ] **Step 5: `GET /api/v1/search`** tidak menjalankan query produk dan mengembalikan daftar produk kosong saat sakelar mati.
- [ ] **Step 6: Perbarui `docs/openapi.yaml`** — tambahkan respons `503` pada lima operasi di atas. Run: `npm run openapi:check`. Expected: lulus.
- [ ] **Step 7: Lint dan typecheck.** Expected: lulus.
- [ ] **Step 8: Verifikasi manual.** Login sebagai pasien demo: `POST /api/v1/cart/items` → `503`; login sebagai klinik demo: menu Janji temu dan Layanan tidak ada; `GET` daftar pesanan lama tetap `200`.

### Task 6: Registry kebutuhan mitra

**Files:**

- Create: `lib/partner-requirements/{types,blocks,partners,schema,index}.ts`, `scripts/checks/registry.check.ts`

**Interfaces:**

- Consumes: `facilityTypes`, `FacilityTypeValue` dari `lib/facility-types`; `zod`.
- Produces:
  - `partnerTypes = [...facilityTypes, 'DOCTOR'] as const`; `type PartnerType`; `isPartnerType(value: unknown): value is PartnerType`.
  - `type FieldKind = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'list' | 'phone' | 'url'`.
  - `type RequirementField = { key: string; label: string; kind: FieldKind; required?: boolean; options?: { value: string; label: string }[]; helpText?: string; filterable?: boolean; target: 'column' | 'details' | 'internal' }`.
  - `type RequirementStep = { id: string; title: string; fields: RequirementField[] }`.
  - `type PartnerRequirement = { draft: boolean; steps: RequirementStep[] }`.
  - `partnerRequirements: Record<PartnerType, PartnerRequirement>` — tipe tanpa entri gagal typecheck. Isi sesuai tabel "Draf field step 3" dan daftar step 2 di spec; semua `draft: true`. Field kolom (`name`, `phone`, `city`, `address`, `latitude`, `longitude`, `specialty`, `bio`, `experienceYears`, `description`) memakai `target: 'column'`; `whatsapp`, `website` dan field khusus tipe memakai `details`; `licenseNumber`, `pharmacistName`, `strNumber` memakai `internal`.
  - `buildStepSchema(step: RequirementStep): z.ZodObject<...>` dan `buildPartnerSchema(type: PartnerType): z.ZodObject<...>`.
  - `splitValues(type: PartnerType, values: Record<string, unknown>): { columns: Record<string, unknown>; details: Record<string, unknown>; internalDetails: Record<string, unknown> }`.

- [ ] **Step 1: Tulis cek yang gagal** di `registry.check.ts`:
  - Setiap `partnerTypes` punya entri dan `draft === true`.
  - `buildPartnerSchema('PHARMACY')` menolak nilai tanpa `name`, dan menerima nilai lengkap (`latitude: -6.2, longitude: 106.8`).
  - Latitude `91` dan longitude `181` ditolak.
  - `splitValues('DOCTOR', {...strNumber:'123'})` menaruh `strNumber` hanya di `internalDetails`, tidak pernah di `details`.
  - Kunci field unik dalam satu tipe, dan tidak ada field `internal` yang `filterable`.
  - `buildStepSchema` untuk step yang semua fieldnya opsional menerima `{}`.
- [ ] **Step 2: Jalankan, pastikan gagal.** Run: `npx tsx scripts/checks/registry.check.ts`. Expected: modul tidak ditemukan.
- [ ] **Step 3: Implementasikan.** Blok bersama (`accountStep`, `contactFields`, `locationStep`) di `blocks.ts`; entri per tipe di `partners.ts` dengan komentar `// DRAF: dicek silang dengan client` di kepala berkas; pembuat skema menerjemahkan `kind` ke Zod (`boolean` → `z.boolean()`, `multiselect` → `z.array(z.enum(...))`, `list` → `z.array(z.string().trim().min(1)).max(30)`, `phone` → string 8–20, `url` → `z.string().url()`), opsional menjadi `.nullish()`.
- [ ] **Step 4: Jalankan, pastikan lulus.** Run: `npx tsx scripts/checks/registry.check.ts`. Expected: kode 0.
- [ ] **Step 5: Lint dan typecheck.** Expected: lulus.

### Task 7: `POST /api/v1/partner/registrations`

**Files:**

- Create: `app/api/v1/partner/registrations/route.ts`
- Delete: `app/api/v1/partner/doctor/route.ts`, `app/api/v1/partner/facility/route.ts`
- Modify: `docs/openapi.yaml`, `lib/audit.ts` (aksi `partnerRegister` bila belum ada)

**Interfaces:**

- Consumes: `partnerRequirements`, `buildPartnerSchema`, `splitValues`, `isPartnerType` (Task 6); `startTrial` (Task 3); `createUniqueFacilitySlug` dari `lib/facility`, `createUniqueDoctorSlug` dari `lib/doctor`, `facilityProfileSelect`, `doctorProfileSelect`; `requireUser`.
- Produces: `POST /api/v1/partner/registrations` body `{ partnerType: PartnerType, values: Record<string, unknown> }` → `201 { data: <profil> }`.

- [ ] **Step 1: Skema pembungkus.** `parseJson` dengan `z.object({ partnerType: z.string(), values: z.record(z.unknown()) })`; `partnerType` yang bukan `isPartnerType` → `422`. Kemudian validasi `values` dengan `buildPartnerSchema(partnerType)`; kegagalan → `422` berisi `details`.
- [ ] **Step 2: Aturan lama dipertahankan** persis seperti rute lama: admin → `403`; sudah punya profil dokter atau fasilitas → `409`.
- [ ] **Step 3: Satu transaksi:** buat `Facility` atau `DoctorProfile` dengan `verificationStatus: 'VERIFIED'`, kolom hasil `splitValues`, `details`, `internalDetails`, slug unik; ubah `User.role` (`DOCTOR`, `PHARMACY` untuk tipe apotek, selain itu `FACILITY`); panggil `startTrial(tx, userId, new Date())`; tulis `Notification` tipe `ACCOUNT` berbunyi masa gratis 6 bulan dan tanggal berakhirnya; tulis audit via `recordActivity`.
- [ ] **Step 4: Hapus dua rute lama** dan pastikan tak ada pemanggil: `grep -rnE "partner/(doctor|facility)" app components lib`. Expected: hanya `facility-register-form.tsx` (dihapus di Task 9).
- [ ] **Step 5: `docs/openapi.yaml`:** hapus dua path lama, tambahkan path baru dengan respons `201/403/409/422`. Run: `npm run openapi:check`. Expected: lulus.
- [ ] **Step 6: Verifikasi manual dengan `curl`** (sesi login): daftar `PHARMACY` valid → `201` dan `Subscription` ada; kirim ulang → `409`; `latitude: 91` → `422`; `partnerType: "X"` → `422`; hitung baris: `select count(*) from "Subscription" where "userId" = '<id>'` → `1`.
- [ ] **Step 7: Lint dan typecheck.** Expected: lulus.

### Task 8: Select publik dan profil

**Files:**

- Modify: `lib/catalog.ts`, `lib/doctor.ts`, `lib/facility.ts`, `lib/admin.ts`

**Interfaces:**

- Produces: `doctorListSelect`, `doctorDetailSelect`, `facilityListSelect`, `facilityDetailSelect` memuat `details: true` dan **tidak** `internalDetails`; `doctorProfileSelect`, `facilityProfileSelect` (milik mitra) dan select detail admin memuat keduanya.

- [ ] **Step 1: Tambahkan `details` ke select publik** dan `internalDetails` hanya ke select mitra/admin.
- [ ] **Step 2: Cek kebocoran.** Run: `grep -nE "internalDetails" lib/catalog.ts`. Expected: tidak ada keluaran.
- [ ] **Step 3: Verifikasi manual.** Daftarkan dokter dengan `strNumber`, lalu `curl /api/v1/doctors`, `/api/v1/doctors/{slug}`, dan `/api/v1/search?q=<nama>`; hasilnya tidak boleh mengandung teks `strNumber` maupun nilainya, tetapi `details` muncul.
- [ ] **Step 4: Lint dan typecheck.** Expected: lulus.

### Task 9: Form pendaftaran bertahap

**Files:**

- Create: `components/partner/RequirementFields.tsx`, `components/partner/PartnerRegisterForm.tsx`
- Modify: `app/mitra/daftar/page.tsx`, `app/mitra/fasilitas/page.tsx`, `lib/roles.ts`, `components/shared/{PartnerMenu,MegaMenu}.tsx`, `components/shared/footer-links.ts`
- Delete: `app/mitra/fasilitas/facility-register-form.tsx`

**Interfaces:**

- Consumes: `partnerRequirements`, `buildStepSchema`, `isPartnerType` (Task 6); `fetchApi`, `ApiError` dari `lib/api-client`.
- Produces:
  - `RequirementFields({ fields, values, errors, onChange }: { fields: RequirementField[]; values: Record<string, unknown>; errors: Record<string, string>; onChange: (key: string, value: unknown) => void })`.
  - `PartnerRegisterForm({ withAccount, lockedType }: { withAccount: boolean; lockedType?: PartnerType })`.
  - `isPartnerSignUpUrl` di `lib/roles.ts` menerima `/mitra/daftar` dengan `?type=` berisi `PartnerType` valid (menggantikan `/mitra/fasilitas`).

- [ ] **Step 1: `RequirementFields`** merender tiap `kind` dengan kelas gaya form yang sama seperti form lama (`fieldClass`, tinggi 48px, label terhubung `htmlFor`, `aria-describedby` untuk `helpText`, pesan galat `aria-live="polite"`); `list` dan `multiselect` memakai kontrol yang bisa dipakai keyboard. Tanpa bayangan atau gradien (aturan desain di `DESIGN-silk.json`).
- [ ] **Step 2: `PartnerRegisterForm`** — step: Akun (hanya `withAccount`), Data dasar (termasuk pilihan tipe bila tidak terkunci), Detail tipe (dilewati jika tipe tidak punya step ini), Lokasi, Tinjau. "Lanjut" memvalidasi step aktif dengan `buildStepSchema`; "Kembali" mempertahankan isian; indikator "Langkah n dari N". Password hanya di state komponen.
- [ ] **Step 3: Lokasi.** Tombol "Gunakan lokasi saya" (`navigator.geolocation`) dan isian lintang/bujur manual; koordinat wajib. Komentar `shortcut: pemilih titik di peta menyusul setelah key Google Maps ada (Fase 3)`.
- [ ] **Step 4: Submit di step Tinjau:** jika `withAccount` dan akun belum siap → `POST /auth/register` lalu `signIn('credentials')`, `accountReady = true`; lalu `POST /partner/registrations`; sukses → `router.replace('/dashboard/dokter' | '/dashboard/fasilitas')` + `router.refresh()`. Galat `409` pada register → kembali ke step Akun dengan tautan masuk; percobaan ulang setelah akun siap tidak membuat akun lagi; tombol dinonaktifkan selama mengirim (mencegah kirim ganda).
- [ ] **Step 5: Halaman.** `/mitra/daftar` memakai `isPartnerType` pada `?type=`; nilai tak dikenal diabaikan. `/mitra/fasilitas` menjadi `redirect` ke `/mitra/daftar` (membawa `type`) agar pasien yang sudah login diteruskan; pasien login membuka `/mitra/daftar` tanpa step Akun. Ganti teks "diverifikasi admin" dengan "Langsung tayang dengan masa gratis 6 bulan".
- [ ] **Step 6: `lib/roles.ts`** — `isPartnerSignUpUrl` mengikuti rute baru; `safeCallbackUrl` tetap menolak apa pun di luar daftar. Menu, mega-menu, dan footer menambah pilihan Dokter (`/mitra/daftar?type=DOCTOR`).
- [ ] **Step 7: Hapus** `facility-register-form.tsx` dan pastikan tak ada sisa impor: `grep -rn "facility-register-form\|FacilityRegisterForm" app components`. Expected: tidak ada.
- [ ] **Step 8: Lint, typecheck.** Expected: lulus.
- [ ] **Step 9: Verifikasi manual di browser** (dev server): daftar satu tipe fasilitas, satu apotek, dan satu dokter melalui `/mitra/daftar?type=...`; cek 360px dan 1280px, navigasi keyboard, "Kembali" tak menghapus isian, `?type=ngawur` menampilkan pilihan tipe, dan dobel-klik pada Kirim hanya menghasilkan satu profil.

### Task 10: Seed, dokumen, dan verifikasi akhir

**Files:**

- Modify: `prisma/seed-demo.ts`, `prisma/seed-test.ts`, `docs/API.md`, `AGENTS.md`, `CLAUDE.md`

**Interfaces:**

- Consumes: skema (Task 1), `details` (Task 6).

- [ ] **Step 1: Seed demo dan test:** untuk setiap dokter/fasilitas, tambahkan baris `Subscription` (`YEARLY`, `endsAt` ± 1 tahun, dengan SQL upsert seperti gaya berkas itu), contoh `details`/`internalDetails` sesuai registry, dan koordinat pada `seed-test` (belum ada).
- [ ] **Step 2: Jalankan seed.** Run: `npm run db:seed:demo`. Expected: selesai tanpa galat, dan berulang kali aman (upsert).
- [ ] **Step 3: Pemeriksaan kedaluwarsa (Review Focus 1, sekaligus verifikasi Task 4).** Jalankan SQL: `update "Subscription" set "endsAt" = now() where ...` untuk satu mitra, lalu verifikasi `GET /api/v1/{doctors,facilities}`, detail `/{slug}` (404), `GET /api/v1/search?q=...`, `POST /appointments`, dan `POST /consultations` tidak lagi menemukannya; kembalikan nilainya.
- [ ] **Step 4: Dokumen.** `AGENTS.md`/`CLAUDE.md`: ganti kalimat "no login UI yet", daftar rute partner, filter katalog `*WhereAt`, sakelar transaksi, dan migrasi `partner_subscriptions`; `docs/API.md`: endpoint baru dan fixture seed. Hanya untuk berkas yang berubah.
- [ ] **Step 5: Seluruh cek.** Run: `npx tsx scripts/checks/months.check.ts && npx tsx scripts/checks/subscription.check.ts && npx tsx scripts/checks/registry.check.ts && npm run lint && npm run typecheck && npm run openapi:check`. Expected: semuanya lulus.
- [ ] **Step 6: Build produksi** dengan dev server dimatikan. Run: `npm run build`. Expected: berhasil.
- [ ] **Step 7: Format berkas yang disentuh saja.** Run: `git status --short | awk '{print $2}' | xargs npx prettier --write`. Expected: tidak ada galat.

---

## Self-Review

- **Cakupan spec Fase 1:** registry (Task 6), form bertahap dan sign up (Task 9), masa gratis (Task 3, 7), filter katalog (Task 4), sakelar transaksi (Task 5), skema (Task 1), seed (Task 10), `details` publik/internal (Task 8). Fase 2/3 dikecualikan secara eksplisit.
- **Konsistensi tipe:** `PartnerType`, `RequirementField`, `splitValues`, `startTrial`, `activeSubscriptionWhere`, `publicXWhereAt` konsisten antara Interfaces dan pemakai.
- **Review Focus:** lima butir masing-masing punya langkah uji (Task 2, 3, 6, 7, 8, 9, 10).
