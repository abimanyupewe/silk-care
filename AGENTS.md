# AGENTS.md

SILK — Indonesian health-services web app. Next.js 15 App Router, React 19, TypeScript
strict, Tailwind CSS v4 (CSS-first config), daisyUI 5, shadcn-style primitives. UI copy,
docs, and code comments are Indonesian; the root layout sets `lang="id"`.

## Commands

- `npm run dev` — dev server on :3000
- `npm run lint` — `next lint` with the flat config; keep it clean (currently clean)
- `npm run typecheck` — `tsc --noEmit`; `npm run build` also typechecks
- `npm run build` — production build (`prebuild` regenerates Prisma Client and runs the OpenAPI contract check)
- `npm run openapi:check` — compare route files and exported methods with `docs/openapi.yaml`
- `npm run format` — Prettier across the repo
- `npm run db:generate` / `db:migrate` / `db:deploy` / `db:push` / `db:studio` / `db:seed` / `db:seed:demo` — Prisma

Use npm (`package-lock.json`). There is no test framework, test script, or CI workflow;
verify changes with `npm run lint`, `npm run typecheck`, and `npm run build`.

Prettier: single quotes, semicolons, width 100, no trailing commas. Husky runs
`lint-staged` (`next lint --fix --file`) on pre-commit and commitlint (Conventional
Commits) on commit-msg. Prettier is **not** enforced by the lint config, so run
`npm run format` before committing.

## Structure

- Single app, no monorepo. `@/*` maps to the repo root.
- Routes: `/` (`app/page.tsx`), `/doctor`, `/apotek`, `/article` (each with `[slug]`), and
  `/search`. Pages compose `Navbar` and `Footer` themselves; there is no shared page shell.
- `components/features/<domain>/` holds page sections; `components/shared/` holds app-wide
  widgets; `components/ui/` holds shadcn-style primitives. Note the directory is
  `components/features/Homepage/` (capital H), unlike the lowercase domain folders.
- API routes: `/api/auth/[...nextauth]`, `/api/v1/auth/*` (including register,
  verify-email, forgot-password, reset-password), `/api/v1/health`, AI scaffold under
  `/api/v1/ai/{chat,status}`, public catalog
  endpoints under `/api/v1/{doctors,facilities,articles,products,search}`, account routes
  at `/api/v1/users/me*`, cart under `/api/v1/cart*`, orders under `/api/v1/orders*`
  (including `orders/[id]/payment`), notifications under `/api/v1/notifications*`, the
  order-expiry cron endpoint at `/api/v1/cron/orders/expire`,
  patient consultations under `/api/v1/consultations*`, patient medical records under
  `/api/v1/medical-records*`, partner
  onboarding under `/api/v1/partner/{doctor,facility}`, partner article CRUD/submission
  under `/api/v1/partner/articles*`, doctor profile and schedule at
  `/api/v1/doctor/{profile,schedule}`, doctor consultation management under
  `/api/v1/doctor/consultations*`, facility profile, operating hours, order, and
  product management under `/api/v1/facility/{profile,operating-hours,orders,products}*`,
  Cloudinary upload signatures at `/api/v1/uploads/signature`, admin
  user/doctor/facility/order/article
  management under `/api/v1/admin/{users,doctors,facilities,orders,articles}*` (including
  article moderation at `articles/[id]/moderate`), admin audit logs at
  `/api/v1/admin/audit-logs`, admin broadcast notifications at
  `/api/v1/admin/notifications/broadcast`, dashboard
  stats at `/api/v1/admin/stats`, the Midtrans webhook at
  `/api/v1/payments/midtrans/webhook`, and reviews under `/api/v1/reviews*` plus
  `/api/v1/admin/reviews*` (including `[id]/moderate`). Use `lib/api.ts` for response/pagination helpers;
  its error body is `{ error, code, details? }`, where `code` is derived from the HTTP
  status (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
  `VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`, `BAD_GATEWAY`,
  `SERVICE_UNAVAILABLE`). The API contract lives in `docs/openapi.yaml` and is served as
  YAML at `/api/v1/openapi`; conventions, error table, endpoint index, and demo fixtures
  live in `docs/API.md`.
  `lib/catalog.ts` for shared public filters/selects, `lib/availability.ts` for day/time
  availability filters, `lib/geo.ts` for coordinate parsing, Haversine distance, and
  bounding boxes, `lib/rating.ts` for rating filters and denormalized review aggregates,
  `lib/audit.ts` for admin audit log helpers and action/target constants,
  `lib/auth-guard.ts` for session/role
  guards, `lib/facility-guard.ts` for facility profile guards, `lib/facility.ts` for
  facility types/profile select/slug helpers, `lib/doctor-guard.ts` for doctor profile
  guards, `lib/doctor.ts` for doctor profile select/slug helpers, `lib/product.ts` for
  partner product selects/slug helpers, `lib/article.ts` for article statuses and
  admin/partner select/slug helpers, `lib/consultation.ts` for consultation/medical
  record selects, statuses, and Jakarta schedule validation, `lib/slug.ts` for shared slug
  generation, `lib/admin.ts` for admin
  user/doctor/facility selects, `lib/cloudinary.ts` for signed uploads and media
  validation, `lib/schedule.ts` for doctor/facility schedule schemas and selects,
  `lib/auth-token.ts` for
  hashed email/reset tokens, `lib/auth-email.ts` for
  verification/reset emails, `lib/cart.ts` for cart projections, `lib/order.ts` for order
  selects/errors/status values, `lib/order-status.ts` for shared order status transitions,
  `lib/order-expiry.ts` for the unpaid-order expiry sweep, `lib/rate-limit.ts` for the
  async rate limiter with `lib/rate-limit-store.ts` (in-memory by default, Upstash REST
  when configured), `lib/logger.ts` for JSON server logs,
  `lib/idempotency.ts` for `Idempotency-Key` request replay and
  cleanup, `lib/transaction-email.ts` for best-effort transactional email
  copy,
  `lib/payments/` for the payment-provider abstraction (`lib/midtrans.ts` stays the
  low-level Snap/signature adapter), `lib/ai/` for the AI provider contract and prompt
  scaffold, and `lib/reviews.ts` for review target
  helpers. Frontend content
  is still hard-coded; wire it to these endpoints later. Searchable records in
  `lib/search-index.ts` still feed the client `SearchModal` and `/search`; replace them
  with `/api/v1/search` when wiring the UI.
- Database layer: Prisma 7 + Neon in `prisma/schema.prisma`; the client singleton is
  `lib/prisma.ts`, re-exported through the `server-only` guard in `lib/db.ts`. Model names
  and enums are Indonesian-domain-oriented but code identifiers are English. Copy
  `.env.example` to `.env` and fill both Neon URLs before running migrations.
- Auth: Auth.js v5 beta in `auth.ts`, credentials + JWT sessions. Route handlers live in
  `app/api/auth/[...nextauth]` and `app/api/v1/auth/*`. Roles are in the `UserRole` enum.
  There is no login UI yet; use the Auth.js default pages or the API directly. Email
  verification and password reset use hashed `AuthToken` rows. JWT payloads carry
  `sessionVersion`; `requireUser` compares it with `User.sessionVersion` so password
  changes/resets and admin deactivation/restoration invalidate old tokens. Without
  `RESEND_API_KEY`/`EMAIL_FROM`, `lib/email.ts` prints the email (including token) to the
  server console in development and throws in production. `/verify-email` and
  `/reset-password` are minimal pages that call the corresponding API routes. Rate limits
  cover auth flows, reviews, AI chat, admin broadcast, change-password, checkout,
  consultation creation, payment creation, upload signatures, and cart writes; the
  limiter is async and uses Upstash REST when `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` are set, otherwise it falls back to in-memory storage.
  `middleware.ts` adds `x-request-id` to `/api/*`; server errors are logged as JSON with
  that ID.

## Database

- Neon Postgres. Runtime uses the pooled `DATABASE_URL`; migrations, introspection, and
  seeds use the direct `DATABASE_URL_UNPOOLED` (see `prisma.config.ts`).
- Prisma Client is generated to `lib/generated/prisma` and gitignored. `postinstall` and
  `prebuild` run `prisma generate`; ESLint ignores that directory.
- The `init`, `add_catalog_slugs`, `marketplace_account_review_models`, `schedule_media`,
  `article_moderation`, `consultation_records`, `catalog_discovery_filters`,
  `catalog_rating_backfill`, `audit_log`, `session_revocation`, and `idempotency_keys`
  migrations have been applied. Do not run `db:push` against production; use `db:migrate` locally and
  `db:deploy` in deployment. Public detail endpoints use the required unique
  `DoctorProfile.slug` and `Facility.slug`.
- Account profile/password, email verification, password reset, cart, customer checkout,
  order cancellation, Midtrans Snap payment creation, webhook processing, notification
  read endpoints, facility profile/product/order management, admin user/doctor/facility/
  order/article management, admin dashboard stats, and review write/moderation endpoints
  are implemented. Admins
  can create, edit, publish/unpublish, soft-delete, and restore articles. Partners with
  the `DOCTOR`, `FACILITY`, or `PHARMACY` role can create their own articles, edit
  `DRAFT`/`REJECTED` rows, submit them for review, and soft-delete them. Submitted articles
  move to `PENDING`; admins approve or reject them through
  `articles/[id]/moderate`, which writes an `ARTICLE` notification to the author. Public
  article endpoints only expose `PUBLISHED`, non-deleted rows. Patients can book a
  consultation at an active doctor schedule slot; the API validates the Jakarta day/time,
  duration, and overlapping doctor/patient bookings, then snapshots the doctor fee. The
  workflow is `REQUESTED -> CONFIRMED -> COMPLETED`, with cancellation before completion.
  Doctors manage their own consultations, complete them, and create the medical record
  (`diagnosis`, `notes`, `prescription`, optional `followUpAt`) only after completion.
  Patients can read only their own consultations and medical records, doctors only their
  own, and every status/record change writes a `CONSULTATION` notification. Admins can list and inspect all
  reviews with filters for status, target, rating, and negative flag, then moderate or
  delete them. Authenticated
  non-admin users can apply once as a doctor or facility; onboarding creates a pending
  profile, updates the user role, and writes an account notification. Partners can update
  their doctor profile, weekly doctor schedule, facility profile, weekly operating hours,
  profile photo/video, and own products; public catalog endpoints still
  require verification and, for products, an active non-deleted product from a verified
  facility. Public doctor/facility lists support `minRating`, rating/review sorting,
  `lat`/`lng`/`radiusKm` distance filters, and `day`/`time` or `availableNow` availability
  filters; responses expose `rating`, `reviewCount`, and `distanceKm` when applicable.
  `/api/v1/search` applies the same rating, distance, and availability filters to
  doctors/facilities. `DoctorProfile` and `Facility` keep denormalized `ratingAverage` and
  `reviewCount` fields, refreshed whenever an approved review is moderated, edited back to
  pending, or deleted. Admins can edit doctor/facility profile fields, approve or reject
  verification, and soft-delete or restore users; changing a facility type to/from
  `PHARMACY` also syncs the owner role, and slugs stay stable. `requireUser` rechecks the
  user row so deactivation takes effect for existing JWT sessions. Checkout snapshots
  product prices into
  `OrderItem`, decrements stock conditionally inside a transaction, writes
  `OrderStatusHistory` and a `Notification`, then clears the cart. Checkout and
  consultation creation accept an optional `Idempotency-Key` header: the same key and
  payload replay the original `201` with `Idempotent-Replayed: true`, a different payload
  returns `409`, and keys expire after 24 hours (the cron endpoint also removes expired
  rows). Checkout sets
  `expiresAt` to 24 hours ahead. `expireDueOrders` cancels due unpaid/failed orders,
  restores stock, writes history plus notification, and sends a payment-expired email; it
  runs from the order list/payment paths and from `/api/v1/cron/orders/expire`, which
  requires `CRON_SECRET`. The Midtrans webhook also cancels and restores stock on
  `EXPIRED`. A payment that settles after cancellation is recorded as paid on the
  cancelled order, writes a refund-needed history entry plus notification, and emails the
  customer. Payment creation returns `503` until `MIDTRANS_SERVER_KEY` is set; the webhook
  verifies the SHA-512 signature before updating `Payment`/`Order`. Payment routes now go through the provider abstraction in
  `lib/payments/`, while Midtrans remains the only provider. The AI chat endpoint is
  scaffolded but returns `503` until an actual provider is implemented; `AI_PROVIDER`,
  `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_TIMEOUT_MS` are reserved for that integration.
  Cloudinary upload signatures go through `lib/cloudinary.ts`; browsers upload directly to
  Cloudinary, then profile updates store the returned URL/publicId. Without
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`, the signature
  endpoint returns `503`. `CLOUDINARY_IMAGE_PRESET` and `CLOUDINARY_VIDEO_PRESET` are
  optional but recommended for format/size enforcement. Article cover uploads use the
  `article-cover` purpose. Public doctor/facility details
  expose active schedules and operating hours; admin detail selects include schedules and
  media but admins do not edit them.
  Orders start `PENDING`/`UNPAID`; a successful settlement
  moves them to `PAID`/`PAID` and writes history plus customer/facility notifications.
  Facility/admin order management only allows `PAID -> PROCESSING -> SHIPPED -> COMPLETED`
  and cancellation before payment; cancelling an unpaid order restores stock. Public
  catalog rating aggregates and public review lists only count approved reviews
  (`Review.status = 'APPROVED'`); new or edited reviews return to `PENDING` until an admin
  moderates them. Review creation writes a `REVIEW` notification to the target owner, and
  moderation writes one to the author. Admin-sensitive mutations write `AuditLog` rows with
  actor, action, target, metadata, IP, and user agent inside the same transaction where
  possible; `GET /api/v1/admin/audit-logs` supports actor/action/target/date filters and
  pagination. `POST /api/v1/admin/notifications/broadcast` sends `SYSTEM` notifications to
  all active users, selected roles, or selected user IDs, and records the broadcast in the
  audit log. Transactional email is best-effort and covers
  order created/status/payment, consultation request/status/record, article moderation,
  review received/moderation, and partner verification; failures are logged, not surfaced
  to the API caller.
- `db:seed` uses `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` from
  `.env`. It deliberately shells out to `prisma db execute` over the direct connection
  instead of using the Neon adapter, which can fail with an opaque `ErrorEvent` when
  outbound WebSocket/HTTP is blocked.
- `db:seed:demo` is optional and demo-only. It adds 2 doctors, 2 facilities, 4 articles,
  4 products, 5 reviews, deterministic weekly doctor schedules, and facility operating
  hours, plus the demo users `clara@`, `santika@`, `klinik@`, `aposilk@`, and
  `pasien@silk.local`. All demo accounts use `SEED_DEMO_PASSWORD`; running it repeatedly is
  safe (upserts by unique keys, and demo schedules/hours are replaced). Stable identifiers
  and QA notes are in `docs/API.md`.

## Gotchas

- Next 15: `params` and `searchParams` are Promises. `await` them; follow
  `app/search/page.tsx`. The three `[slug]` pages do not await or use their params; they
  just `console.log(params)` and render the same hardcoded detail content regardless of
  slug. Do not copy that pattern.
- Only `app/layout.tsx` renders `<html>`/`<body>`. The nested `doctor`, `apotek`, and
  `article` layouts are plain wrappers; keep it that way for new routes.
- `next-intl` is installed but not configured (no middleware, messages, or locale routing).
  Do not assume i18n infrastructure exists.
- ESLint 9 uses the flat config `eslint.config.mjs`. `.eslintrc.json` is legacy, contains a
  JS-style comment (invalid JSON), and is ignored by ESLint 9 — edit the flat config.
- `next dev` and `next build` share `.next`. Running a build while the dev server is alive
  corrupts the dev asset manifest: CSS/chunks return 404 and the page renders unstyled
  (often just the `fill` image covering the viewport). Stop dev first; if it happens, kill
  the dev server, `rm -rf .next`, and restart.
- Use `cn()` from `lib/utils` and the design tokens in `app/globals.css`
  (`text-ink`, `bg-surface`, `text-primary-hover`, etc.) instead of raw brand hex values.
- `README.md` is the stock create-next-app file and is wrong about fonts (it says Geist).
  Trust `app/layout.tsx` and `app/globals.css`; treat `dev/SRS SILK.md` as planned scope,
  not implemented behavior.

## Design constraints

Before UI work, read `hard_rules` in `DESIGN-silk.json` and the status notes in
`dev/RINGKASAN-PERUBAHAN-UI.md`. Main rules: no shadows, gradients, or glass effects;
separate with 1px borders; one primary button per area; text minimum 14px with body at
16px; tap targets >=44px; Indonesian price formatting; status/promo meaning always paired
with icon + label.

Known conflict: `hard_rules` call for `border-radius: 0`, but `app/globals.css` still
defines 6–20px radii and components use `rounded-md`. Radius migration is explicitly still
a plan, so match the surrounding component unless the task is that migration.

Fonts are configured in `app/layout.tsx` (local Satoshi from `public/assets/fonts`, Inter
via `next/font/google`). Do not add Google Fonts `@import` to CSS.
