# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The notes below add to AGENTS.md. Where they disagree, these notes reflect the current
`panel/admin` work (AGENTS.md still says there is no login UI; `app/login` and `app/admin`
now exist).

## Verification

No tests exist. After changes run `npm run lint && npm run typecheck`; run `npm run build`
only with the dev server stopped (see the `.next` gotcha). Adding, removing, or renaming an
API route file or an exported HTTP method requires a matching edit to `docs/openapi.yaml`, or
`npm run openapi:check` (also run by `prebuild`) fails.

## API route anatomy

Route handlers under `app/api/v1/**/route.ts` follow one shape, e.g.
`app/api/v1/admin/users/route.ts` and `app/api/v1/admin/users/[id]/route.ts`:

1. Wrap the whole body in `try { ... } catch (error) { return handleRouteError(error); }`.
2. Guard first: `const auth = await requireRole(['ADMIN'])` (or `requireUser()`) from
   `lib/auth-guard.ts`; `if (!auth.ok) return auth.error;`. Partner routes then use
   `lib/doctor-guard.ts` / `lib/facility-guard.ts`.
3. Read query params with the `lib/api.ts` helpers (`getString`, `getEnum`, `getBoolean`,
   `getInt`, `getPagination`), and bodies with `parseJson(request, zodSchema)`.
4. Query Prisma via `prisma` from `lib/db.ts` (not `lib/prisma.ts`) with a shared `select`
   constant from the domain lib (`adminUserSelect`, etc.).
5. Respond with `jsonOk(data, paginationMeta(total, pagination))`, `jsonCreated`, or
   `jsonError(message, status)`. Success bodies are `{ data, meta? }`.
6. Admin mutations call `writeAuditLog(input, tx)` from `lib/audit.ts` (action names come
   from `auditActions`) inside the same `prisma.$transaction` as the change.

## Admin panel (`/admin`)

- `app/admin/layout.tsx` is a server component: it calls `auth()`, redirects anonymous users
  to `/login?callbackUrl=/admin` and non-admins to `/`, then renders `AdminShell`.
  `app/login` is the admin credentials login page.
- Each `app/admin/**/page.tsx` stays thin: it awaits `searchParams`, normalizes them with
  `adminParam`/`adminPage` from `lib/admin-query.ts`, and passes a `filters` object to a
  `'use client'` component in `components/admin/`.
- Client components fetch the REST API, not Prisma, through `fetchAdmin` in
  `lib/admin-api.ts`. It prefixes `/api/v1`, unwraps `{ data, meta }`, and throws
  `AdminApiError` (with `status`/`code`). Client-side admin types and label maps live there
  too; date/currency/rating formatting is in `lib/admin-format.ts`.
- Reuse the shared admin building blocks for new screens: `AdminPageHeader`,
  `AdminPagination`, `AdminTableSkeleton`/`AdminDetailSkeleton`, `AdminEmptyState`/
  `AdminErrorState`, and the `*Badge` components. The design rules in AGENTS.md apply.
