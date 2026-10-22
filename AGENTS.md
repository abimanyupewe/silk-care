# AGENTS.md

SILK — Indonesian health-services web app. Next.js 15 App Router, React 19, TypeScript
strict, Tailwind CSS v4 (CSS-first config), daisyUI 5, shadcn-style primitives. UI copy,
docs, and code comments are Indonesian; the root layout sets `lang="id"`.

## Commands

- `npm run dev` — dev server on :3000
- `npm run lint` — `next lint`; keep it clean (it is currently clean)
- `npm run build` — production build; this is also the only typecheck (`tsc` is not wired
  to a script)
- `npm run format` — Prettier across the repo

There is no test framework, test script, or CI workflow. Verify changes with
`npm run lint` and `npm run build`.

Prettier: single quotes, semicolons, width 100, no trailing commas. Husky runs
`lint-staged` (`next lint --fix --file`) on pre-commit and commitlint (Conventional
Commits) on commit-msg.

## Structure

- Single app, no monorepo. `@/*` maps to the repo root.
- Routes: `/` (`app/page.tsx`), `/doctor`, `/apotek`, `/article` (each with `[slug]`), and
  `/search`. Pages compose `Navbar` and `Footer` themselves; there is no shared page shell.
- `components/features/<domain>/` holds page sections; `components/shared/` holds app-wide
  widgets; `components/ui/` holds shadcn-style primitives.
- No backend or API routes. Content is hard-coded in feature components. Searchable records
  live in `lib/search-index.ts` and feed both the client `SearchModal` and the server
  `/search` page — add new searchable items there.

## Gotchas

- Next 15: `params` and `searchParams` are Promises. `await` them; follow
  `app/search/page.tsx`. The `[slug]` pages currently ignore their params and only
  `console.log` them.
- `app/{doctor,apotek,article}/layout.tsx` and their `[slug]/layout.tsx` each render a full
  `<html>`/`<body>`, nesting inside the root layout. Do not copy this pattern for new
  routes; rely on `app/layout.tsx`.
- `next-intl` is installed but not configured (no middleware, messages, or locale routing).
  Do not assume i18n infrastructure exists.
- ESLint 9 uses the flat config `eslint.config.mjs`. `.eslintrc.json` is legacy and ignored
  by ESLint 9 — edit the flat config. Prettier is not enforced by ESLint, so run
  `npm run format` before committing.
- `next dev` and `next build` share `.next`. Running a build while the dev server is alive
  corrupts the dev asset manifest: CSS/chunks return 404 and the page renders unstyled
  (often just the `fill` image covering the viewport). Stop dev first; if it happens, kill
  the dev server, `rm -rf .next`, and restart.
- Use `cn()` from `lib/utils` and the design tokens in `app/globals.css`
  (`text-ink`, `bg-surface`, `text-primary-hover`, etc.) instead of raw brand hex values.

## Design constraints

Before UI work, read `hard_rules` in `DESIGN-silk.json` and the status notes in
`dev/RINGKASAN-PERUBAHAN-UI.md`. Main rules: no shadows, gradients, or glass effects;
separate with 1px borders; one primary button per area; body text >=16px and tap targets
>=44px; Indonesian price formatting; status/promo meaning always paired with icon + label.

Known conflict: `hard_rules` call for `border-radius: 0`, but `app/globals.css` still
defines 6–20px radii and components use `rounded-md`. Radius migration is explicitly still
a plan, so match the surrounding component unless the task is that migration.

Fonts are configured in `app/layout.tsx` (local Satoshi from `public/assets/fonts`, Inter
via `next/font/google`). Do not add Google Fonts `@import` to CSS.
