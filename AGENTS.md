# AGENTS.md

SILK — Indonesian health-services web app. Next.js 15 App Router, React 19, TypeScript
strict, Tailwind CSS v4 (CSS-first config), daisyUI 5, shadcn-style primitives. UI copy,
docs, and code comments are Indonesian; the root layout sets `lang="id"`.

## Commands

- `npm run dev` — dev server on :3000
- `npm run lint` — `next lint` with the flat config; keep it clean (currently clean)
- `npm run typecheck` — `tsc --noEmit`; `npm run build` also typechecks
- `npm run build` — production build (`prebuild` regenerates Prisma Client)
- `npm run format` — Prettier across the repo
- `npm run db:generate` / `db:migrate` / `db:deploy` / `db:push` / `db:studio` / `db:seed` — Prisma

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
- No API routes yet. Content is still hard-coded in feature components. Searchable records
  live in `lib/search-index.ts` and feed both the client `SearchModal` and the server
  `/search` page — add new searchable items there.
- Database layer: Prisma 7 + Neon in `prisma/schema.prisma`; the client singleton is
  `lib/prisma.ts`, re-exported through the `server-only` guard in `lib/db.ts`. Model names
  and enums are Indonesian-domain-oriented but code identifiers are English. Copy
  `.env.example` to `.env` and fill both Neon URLs before running migrations.
- Auth: Auth.js v5 beta in `auth.ts`, credentials + JWT sessions. Route handlers live in
  `app/api/auth/[...nextauth]` and `app/api/v1/auth/*`. Roles are in the `UserRole` enum.
  There is no login UI yet; use the Auth.js default pages or the API directly.

## Database

- Neon Postgres. Runtime uses the pooled `DATABASE_URL`; migrations, introspection, and
  seeds use the direct `DATABASE_URL_UNPOOLED` (see `prisma.config.ts`).
- Prisma Client is generated to `lib/generated/prisma` and gitignored. `postinstall` and
  `prebuild` run `prisma generate`; ESLint ignores that directory.
- The `init` migration has been applied. Do not run `db:push` against production; use
  `db:migrate` locally and `db:deploy` in deployment.
- `db:seed` uses `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` from
  `.env`. It deliberately shells out to `prisma db execute` over the direct connection
  instead of using the Neon adapter, which can fail with an opaque `ErrorEvent` when
  outbound WebSocket/HTTP is blocked.

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
