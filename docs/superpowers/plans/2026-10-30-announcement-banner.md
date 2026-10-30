# Banner Informasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin menyimpan banyak banner informasi, memilih satu untuk diaktifkan, dan banner aktif tampil di atas navbar publik.

**Architecture:** Model `Announcement` dengan indeks unik parsial yang menjamin satu baris aktif. Route publik + CRUD admin mengikuti anatomi di `CLAUDE.md`; komponen klien `AnnouncementBanner` mengambil banner aktif, dirender di `Navbar`. Halaman admin memakai blok admin bersama.

**Tech Stack:** Next.js 15 App Router, Prisma 7 + Neon, Zod, SWR (`useApiQuery`), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-10-30-announcement-banner-design.md`

## Global Constraints

- Satu banner aktif: `POST`/`PATCH` yang menghasilkan `active = true` menonaktifkan semua baris lain dalam transaksi yang sama; indeks unik parsial `"Announcement_single_active_idx" ON "Announcement" ((true)) WHERE "active"` ditulis manual di `migration.sql`; tabrakan (P2002) → 409.
- `message` 1–200 karakter, `linkLabel` 1–40, `linkUrl` ≤500; `linkUrl` dan `linkLabel` diisi bersamaan atau keduanya kosong; `linkUrl` hanya path internal (diawali `/`, bukan `//`) atau `https://`; `endsAt` harus setelah `startsAt`.
- `message` yang memuat `[` atau `]` boleh disimpan sebagai draf, tetapi tidak boleh `active = true` (422).
- Banner baru berstatus draf: default database dan default POST `active = false` (menyimpang dari baris `@default(true)` di spec; keputusan: mengaktifkan harus disengaja karena menonaktifkan banner lain).
- Teks UI dan komentar bahasa Indonesia; tanpa shadow/gradient; target sentuh ≥44px; teks ≥14px; makna nada selalu ikon + label, tidak hanya warna.
- Route baru wajib masuk `docs/openapi.yaml`; `npm run openapi:check` lolos.
- Tanpa kerangka tes. Verifikasi tiap task: `npm run lint && npm run typecheck`, plus `openapi:check` bila route berubah. Pemeriksaan manual yang menulis ke Neon bersama dijalankan oleh pengguna, bukan eksekutor.
- **Tanpa langkah commit.** Pengguna meng-commit sendiri; eksekutor tidak menjalankan `git add` atau `git commit`.
- Format hanya file yang disentuh: `npx prettier --write <file...>`; jangan `npm run format`.
- Migrasi: `prisma migrate diff --from-schema <schema lama> --to-schema prisma/schema.prisma --script`, lalu tambah indeks parsial secara manual, simpan sebagai `prisma/migrations/<timestamp>_announcements/migration.sql`, terapkan dengan `npm run db:deploy` (bukan `migrate dev`).
- `npm run build` hanya dengan dev server mati.

## Review Focus

- Dua aktivasi bersamaan tidak boleh menghasilkan dua baris aktif (indeks parsial; yang kalah → 409).
- `javascript:`, `data:`, `http:`, `//evil.com`, dan string kosong ditolak sebagai `linkUrl`.
- PATCH hanya mengubah `endsAt` ke sebelum `startsAt` yang sudah tersimpan → 422 (evaluasi nilai gabungan).
- Banner dengan `[tanggal]` tidak bisa diaktifkan lewat POST maupun PATCH, tetapi bisa disimpan sebagai draf.
- Banner terjadwal (mulai di masa depan) dan yang sudah berakhir tidak dikembalikan endpoint publik.
- Menutup banner lalu mengubah isinya (`updatedAt` berubah) memunculkannya lagi; `localStorage` yang diblokir tidak merusak halaman.

Tiap baris punya pemeriksaan di task pemiliknya (Task 2, 3, dan 4).

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `prisma/schema.prisma` + migrasi | Model dan enum |
| `lib/announcement.ts` | Skema Zod, select, filter tampil, status, util tautan/placeholder (tanpa import server, aman untuk klien) |
| `lib/announcement-templates.ts` | Lima template bawaan |
| `lib/audit.ts` | Aksi dan tipe target audit |
| `app/api/v1/announcements/active/route.ts` | Banner aktif publik |
| `app/api/v1/admin/announcements/route.ts`, `[id]/route.ts` | CRUD admin |
| `components/shared/AnnouncementBar.tsx` | Tampilan banner (presentasi murni, dipakai publik dan pratinjau admin) |
| `components/shared/AnnouncementBanner.tsx` | Ambil data, tutup, simpan pilihan di localStorage |
| `components/shared/Navbar.tsx` | Menyisipkan banner |
| `components/admin/AdminAnnouncements.tsx`, `app/admin/announcements/page.tsx`, `AdminShell.tsx` | Halaman admin dan menu |
| `lib/admin-api.ts` | Tipe `AdminAnnouncement` untuk klien |

---

### Task 1: Skema dan migrasi

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_announcements/migration.sql`

**Interfaces:**
- Produces: model `Announcement` (`id`, `message`, `linkLabel?`, `linkUrl?`, `tone AnnouncementTone @default(INFO)`, `active Boolean @default(false)`, `dismissible Boolean @default(true)`, `startsAt?`, `endsAt?`, `createdAt`, `updatedAt`, `@@index([active, startsAt, endsAt])`); enum `AnnouncementTone { INFO PROMO IMPORTANT }`.

- [ ] **Step 1:** Simpan salinan schema saat ini ke file sementara di scratchpad, lalu tambahkan model dan enum sesuai Interfaces.
- [ ] **Step 2:** Hasilkan SQL dengan `prisma migrate diff` (salinan lama → schema baru, `--script`) ke `migration.sql` di folder baru (timestamp lebih baru dari migrasi terakhir di `prisma/migrations`). Tambahkan di akhir berkas: `CREATE UNIQUE INDEX "Announcement_single_active_idx" ON "Announcement" ((true)) WHERE "active";` dengan komentar satu baris yang menjelaskan tujuannya.
- [ ] **Step 3:** Jalankan `npm run db:deploy`. Expected: migrasi baru diterapkan tanpa error. Jalankan `npm run db:generate` dan `npm run typecheck`. Expected: lolos.

---

### Task 2: Pustaka banner, template, audit

**Files:**
- Create: `lib/announcement.ts`, `lib/announcement-templates.ts`
- Modify: `lib/audit.ts`, `lib/admin-api.ts`

**Interfaces:**
- Produces di `lib/announcement.ts`:
  - `announcementTones: readonly ['INFO','PROMO','IMPORTANT']`, `type AnnouncementToneValue`, `announcementToneLabels: Record<AnnouncementToneValue, string>` ("Informasi", "Promo", "Penting").
  - `isSafeLinkUrl(url: string): boolean`; `hasPlaceholder(message: string): boolean`.
  - `announcementCreateSchema` / `announcementUpdateSchema` (Zod; update = semua opsional, minimal satu field) sesuai aturan Global Constraints, dengan `active` default `false` pada create.
  - `validateAnnouncementState(state: { message: string; linkLabel: string | null; linkUrl: string | null; active: boolean; startsAt: Date | null; endsAt: Date | null }): string | null` — mengembalikan pesan kesalahan Indonesia atau `null`; dipakai POST dan PATCH terhadap nilai gabungan (pasangan tautan, `isSafeLinkUrl`, `endsAt > startsAt`, placeholder + aktif).
  - `announcementSelect`, `publicAnnouncementSelect` (`id, message, linkLabel, linkUrl, tone, dismissible, updatedAt`), `liveAnnouncementWhere(now: Date): Prisma.AnnouncementWhereInput`.
  - `announcementStatus(a: { active: boolean; startsAt: string | Date | null; endsAt: string | Date | null }, now?: Date): 'LIVE' | 'SCHEDULED' | 'ENDED' | 'DRAFT'`, dan `announcementStatusLabels: Record<…, string>` ("Sedang tampil", "Terjadwal", "Berakhir", "Draf").
- Produces di `lib/announcement-templates.ts`: `announcementTemplates: Array<{ key: string; label: string; message: string; tone: AnnouncementToneValue; linkLabel: string | null; linkUrl: string | null }>` berisi lima template dari spec (`promo`, `maintenance`, `incident`, `new-facility`, `partner-invite`) dengan teks persis seperti di spec.
- `lib/audit.ts`: `auditActions.announcementCreate = 'ANNOUNCEMENT_CREATE'`, `announcementUpdate = 'ANNOUNCEMENT_UPDATE'`, `announcementDelete = 'ANNOUNCEMENT_DELETE'`; `'ANNOUNCEMENT'` ditambahkan ke `auditTargetTypes`.
- `lib/admin-api.ts`: `type AdminAnnouncement = { id: string; message: string; linkLabel: string | null; linkUrl: string | null; tone: AnnouncementToneValue; active: boolean; dismissible: boolean; startsAt: string | null; endsAt: string | null; createdAt: string; updatedAt: string }`.

- [ ] **Step 1:** Tulis `lib/announcement.ts` dan `lib/announcement-templates.ts` sesuai Interfaces. `isSafeLinkUrl` menerima hanya string yang diawali `/` dan bukan `//`, atau yang diawali `https://`; `liveAnnouncementWhere` = `active` dan (`startsAt` null atau ≤ now) dan (`endsAt` null atau > now).
- [ ] **Step 2:** Tambah aksi dan tipe target ke `lib/audit.ts`, dan tipe klien ke `lib/admin-api.ts`.
- [ ] **Step 3:** Verifikasi aturan murni dengan skrip lokal sementara di scratchpad (dijalankan via `npx tsx` dari root proyek, dihapus sesudahnya): `isSafeLinkUrl` menolak `javascript:alert(1)`, `data:text/html,x`, `http://a.com`, `//evil.com`, `''`, dan menerima `/fasilitas`, `https://silk.example/x`; `hasPlaceholder('Pemeliharaan [tanggal]')` benar dan `hasPlaceholder('Halo')` salah; `validateAnnouncementState` menolak `endsAt` sebelum `startsAt`, menolak pasangan tautan tak lengkap, dan menolak `active: true` dengan placeholder; `announcementStatus` mengembalikan LIVE/SCHEDULED/ENDED/DRAFT untuk empat kombinasi. Expected: semua assert lolos.
- [ ] **Step 4:** `npm run lint && npm run typecheck`. Expected: lolos.

---

### Task 3: API publik dan admin

**Files:**
- Create: `app/api/v1/announcements/active/route.ts`, `app/api/v1/admin/announcements/route.ts`, `app/api/v1/admin/announcements/[id]/route.ts`
- Modify: `docs/openapi.yaml`

**Interfaces:**
- Consumes: `lib/announcement.ts`, `writeAuditLog`/`auditActions` dari `lib/audit.ts`, `requireRole(['ADMIN'])`.
- Produces:
  - `GET /announcements/active` → `{ data: PublicAnnouncement | null }` memakai `liveAnnouncementWhere(new Date())`, urut `updatedAt` desc, `findFirst`; tanpa autentikasi.
  - `GET /admin/announcements` (pagination 10, filter `active` boolean; urut `createdAt` desc) dan `POST` (201) dengan `announcementCreateSchema`.
  - `GET/PATCH/DELETE /admin/announcements/[id]`; DELETE mengembalikan `{ id }`.
  - Aturan: sebelum menulis, `validateAnnouncementState` terhadap nilai gabungan (422). Dalam `prisma.$transaction`: bila hasil `active === true`, `updateMany({ where: { active: true, id: { not: id } }, data: { active: false } })`, lalu buat/ubah baris, lalu `writeAuditLog` (aksi sesuai, `targetType: 'ANNOUNCEMENT'`, `metadata` memuat `active`). Tangkap `Prisma.PrismaClientKnownRequestError` kode `P2002` → `jsonError('Banner aktif berubah, muat ulang lalu coba lagi.', 409)`.

- [ ] **Step 1:** Tulis tiga route mengikuti anatomi `app/api/v1/admin/users/route.ts` dan `[id]/route.ts` (`try/catch` + `handleRouteError`, guard, helper `lib/api.ts`, `select` bersama).
- [ ] **Step 2:** Tambahkan path, method, dan skema (`Announcement`, `PublicAnnouncement`, enum nada) ke `docs/openapi.yaml`, tag Admin untuk route admin dan Public Catalog + `security: []` untuk route publik.
- [ ] **Step 3:** `npm run lint && npm run typecheck && npm run openapi:check`. Expected: lolos.
- [ ] **Step 4 (manual, pengguna):** login admin lalu dari konsol browser: POST `linkUrl: 'javascript:alert(1)'` → 422; POST dengan `endsAt` sebelum `startsAt` → 422; POST `message: 'Pemeliharaan [tanggal]'` dengan `active: true` → 422 tetapi `active: false` → 201; buat dua banner lalu aktifkan keduanya berurutan → hanya yang terakhir aktif; kirim dua PATCH `active: true` bersamaan ke dua banner berbeda → tepat satu 200 dan satu 409, tidak pernah dua aktif; PATCH hanya `endsAt` ke sebelum `startsAt` tersimpan → 422; `GET /announcements/active` tanpa login tidak mengembalikan banner terjadwal atau yang sudah berakhir; non-admin → 403.

---

### Task 4: Tampilan publik

**Files:**
- Create: `components/shared/AnnouncementBar.tsx`, `components/shared/AnnouncementBanner.tsx`
- Modify: `components/shared/Navbar.tsx`

**Interfaces:**
- Consumes: `GET /announcements/active` (Task 3), `announcementToneLabels`.
- Produces:
  - `AnnouncementBar({ announcement, onDismiss }: { announcement: { message: string; linkLabel: string | null; linkUrl: string | null; tone: AnnouncementToneValue; dismissible: boolean }; onDismiss?: () => void })` — presentasi murni (tanpa data fetch): `role="status"`, ikon per nada (`Info`, `Sparkles`, `TriangleAlert`) plus label tersembunyi untuk pembaca layar, tautan internal memakai `next/link` dan eksternal `<a rel="noopener noreferrer">`, tombol tutup 44px dengan `aria-label="Tutup pengumuman"` hanya bila `dismissible` dan `onDismiss` ada. Warna: INFO `bg-primary-tint text-primary-deep`, PROMO `bg-amber-tint text-amber-ink`, IMPORTANT `bg-destructive text-white`.
  - `AnnouncementBanner()` — klien: `useApiQuery<PublicAnnouncement | null>('/announcements/active', 300000)`; menyimpan `${id}:${updatedAt}` di `localStorage` kunci `silk-announcement-dismissed` (semua akses try/catch); tidak merender apa pun saat memuat, saat galat, saat `null`, atau saat kunci tersimpan sama dengan banner saat ini.
  - `Navbar` merender `<AnnouncementBanner />` tepat sebelum `<nav>` di dalam fragment (non-sticky).

- [ ] **Step 1:** Tulis kedua komponen sesuai Interfaces.
- [ ] **Step 2:** Sisipkan `AnnouncementBanner` di `Navbar.tsx`. Panel dropdown sudah menempel ke `<nav>` (`absolute top-full`), jadi tidak perlu menyesuaikan posisinya.
- [ ] **Step 3:** `npx prettier --write` pada file yang disentuh, lalu `npm run lint && npm run typecheck`. Expected: lolos.
- [ ] **Step 4 (manual, pengguna, setelah Task 3 dan 5):** banner aktif muncul di `/` dan `/doctor`; tutup lalu muat ulang tetap tertutup; ubah isi lewat admin lalu muncul lagi dalam ≤5 menit atau setelah refresh; blokir `localStorage` di DevTools tidak merusak halaman; dropdown "Layanan" dan "Jadi mitra" tetap menempel tepat di bawah navbar saat banner tampil.

---

### Task 5: Halaman admin

**Files:**
- Create: `components/admin/AdminAnnouncements.tsx`, `app/admin/announcements/page.tsx`
- Modify: `components/admin/AdminShell.tsx`

**Interfaces:**
- Consumes: `/admin/announcements*` (Task 3), `AdminAnnouncement`, `announcementTemplates`, `announcementStatus`/`announcementStatusLabels`, `announcementToneLabels`, `AnnouncementBar`, blok admin bersama (`AdminPageHeader`, `AdminModal`, `AdminTableSkeleton`, `AdminEmptyState`, `AdminErrorState`, `fetchAdmin` dari `lib/admin-api.ts`).
- Produces: rute `/admin/announcements`; item menu `{ href: '/admin/announcements', label: 'Banner informasi', icon: Info }` di grup **Sistem** (bukan "Operasional").

- [ ] **Step 1:** Halaman `page.tsx` tipis (metadata + render komponen), mengikuti `app/admin/email-templates/page.tsx`.
- [ ] **Step 2:** `AdminAnnouncements`: daftar dengan lencana status (ikon + label) dan lencana "Sedang tampil" pada banner berstatus LIVE; aksi per baris Aktifkan/Nonaktifkan (konfirmasi menyebut banner yang akan dinonaktifkan bila ada yang lain aktif), Ubah, Duplikat (POST dengan isi asal dan `active: false`), Hapus (konfirmasi). Galat 409 dari server ditampilkan dengan tombol "Muat ulang".
- [ ] **Step 3:** Tombol "Buat banner" membuka `AdminModal` pemilih: daftar template (label + pratinjau `AnnouncementBar`) dan "Banner kosong"; memilih membuka formulir yang terisi. Formulir: pesan dengan penghitung karakter (maks 200), tautan dan label opsional, nada, tanggal mulai/selesai (`datetime-local`, dipahami sebagai Asia/Jakarta: kirim sebagai ISO dengan offset `+07:00` dan tampilkan dikonversi balik), dapat ditutup, aktif. Pratinjau langsung memakai `AnnouncementBar`. Bila pesan memuat `[` atau `]`: tampilkan peringatan "Lengkapi bagian dalam [ ]" dan nonaktifkan kotak aktif.
- [ ] **Step 4:** Tambahkan item menu di `AdminShell.tsx`.
- [ ] **Step 5:** `npx prettier --write` pada file yang disentuh, lalu `npm run lint && npm run typecheck`. Expected: lolos.
- [ ] **Step 6 (manual, pengguna):** buat banner dari tiap template; template pemeliharaan tidak bisa diaktifkan sebelum `[ ]` diisi; aktifkan dua banner berurutan dan hanya yang terakhir bertanda "Sedang tampil"; duplikat menghasilkan draf; hapus meminta konfirmasi; layar sempit tidak punya scroll horizontal.

---

### Task 6: Dokumentasi dan verifikasi akhir

**Files:**
- Modify: `AGENTS.md`, `docs/API.md`, `docs/superpowers/specs/2026-10-30-announcement-banner-design.md`

- [ ] **Step 1:** Perbarui spec: grup menu menjadi "Sistem" dan `active @default(false)`. Perbarui `AGENTS.md` (daftar route `/api/v1/announcements/active` dan `/api/v1/admin/announcements*`, daftar migrasi `announcements`, satu paragraf aturan banner: satu aktif, indeks parsial, placeholder, `localStorage`) dan `docs/API.md` (indeks endpoint).
- [ ] **Step 2:** Jalankan `npm run lint && npm run typecheck && npm run openapi:check`. Expected: semua lolos.
- [ ] **Step 3 (pengguna):** hentikan dev server, jalankan `npm run build`. Expected: lolos.
