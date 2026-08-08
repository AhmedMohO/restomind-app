# Security & Request-Management Hardening — Design

Date: 2026-08-08
Status: Approved

## Context

`restomind-app` is a Next.js 16 BFF in front of the external `RestoMindAPI`. It
already has good bones: Iron Session (httpOnly/secure/sameSite cookies), Zod
validation at the route boundary via `readJsonBody`, and role-based auth
helpers (`requireAuth` / `requireAnyRole` / `requireSessionUser` /
`requireRole`) used consistently in most route handlers.

A targeted audit (three parallel read-only passes: API route handlers,
frontend request patterns, auth/authz flow) found a small number of places
where handlers deviate from the established pattern, one architectural bug
that silently downgrades server-side role enforcement to client-only for most
dashboard pages, and a few sources of redundant network requests. None of
this needs new abstractions — every fix reuses a helper, schema pattern, or
Next.js native feature that already exists elsewhere in this codebase.

Rate limiting is explicitly **out of scope** for this pass (app is
single-instance, no Redis; revisit if that changes).

## Phase 1 — Critical auth/authz fixes

These are live privilege-escalation / data-exposure bugs. Fix first,
independently deployable.

### 1.1 Dashboard role enforcement is client-only for most pages

**Root cause**: `app/[locale]/dashboard/layout.tsx:49` calls
`<ProtectedRoute route={`/${locale}/dashboard`}>` with a **hardcoded** route
string, regardless of which dashboard page is actually being visited.
`ProtectedRoute` (`features/auth/components/ProtectedRoute.tsx`) correctly
resolves per-page roles via `getRouteRoles(route)` against
`ROUTE_ROLE_MAP` — it just never receives the real path, so every dashboard
page gets the coarse `DASHBOARD_ALLOWED_ROLES` (admin/manager/staff) check
server-side. Fine-grained restrictions (e.g. `/dashboard/categories`:
admin-only) are enforced only by `<DashboardAuthGuard>`, a `"use client"`
component — which blocks *rendering* client-side but does not stop the
server from including that page's RSC payload (and any data it fetched) in
the response sent to an unauthorized browser.

**Fix**: `proxy.ts` already computes the real pathname into an `x-pathname`
response header (`intlResponse.headers.set("x-pathname", pathname)`) for
exactly this purpose but nothing reads it server-side yet. In
`dashboard/layout.tsx`, read the incoming request's pathname via
`next/headers` `headers()` and pass the actual normalized path (falling back
to `/${locale}/dashboard` if the header is absent, e.g. direct server
calls/tests) to `<ProtectedRoute route={...}>`.

**Follow-up**: audit every `<DashboardAuthGuard roles={...}>` usage across
`app/[locale]/dashboard/**` and ensure `ROUTE_ROLE_MAP` in
`lib/auth/config.ts` has a matching-or-stricter entry for that path prefix
(e.g. add `/dashboard/admin/settings: ["admin"]` if missing). The client
guard and the server map must agree; the map is now the actual security
boundary.

### 1.2 `/api/users` — unauthenticated privilege escalation

`app/api/users/route.ts`:
- `GET` (line ~6): no role check at all — any authenticated user (including
  `customer`) can list all users (PII).
- `POST` (line ~47): no role check, and the body is cast `as
  CreateUserPayload` with no schema validation. `CreateUserPayload.role` /
  `restaurantId` are forwarded verbatim upstream — a logged-in customer can
  self-promote to `admin` by posting `{ role: "admin", ... }`.

**Fix**: gate both with `requireAnyRole(["admin", "manager"])` (matching the
role set used by sibling routes in `users/[id]/status`,
`users/[id]/resend-setup-email`). Add a Zod schema for the create-user body
via `readJsonBody`; the schema must not let a caller who isn't `admin` set
`role` to anything above their own privilege, and must not accept an
arbitrary `restaurantId` — derive `restaurantId` from `auth.user` when the
caller is a manager, only trust the body's `restaurantId` for admins.

### 1.3 `PATCH /api/users/[id]` — role/restaurantId escalation via unvalidated body

`app/api/users/[id]/route.ts` (PATCH, line ~76): role-gated
(`admin`/`manager`) but the body is cast `as UpdateUserPayload` with no
schema, so a manager can PATCH another user's `role` to `admin` or move them
to a different `restaurantId`.

**Fix**: same Zod-schema treatment as 1.2 — non-admin callers cannot change
`role` or `restaurantId` through this endpoint.

### 1.4 System settings Server Actions have no server-side role check

`features/system-settings/actions.ts` (`fetchSystemSettingsAction` /
`updateSystemSettingsAction`): zero role check. Only the client
`DashboardAuthGuard` on the settings page hides the UI; the action itself is
directly callable by any authenticated user.

**Fix**: add `await requireRole(["admin"])` (from `lib/auth/auth.ts`, the
existing helper used by `ProtectedRoute`) at the top of both actions.

### 1.5 Missing auth/role checks on smaller routes

- `GET /api/users/[id]` — no role check (PATCH/DELETE in the same file
  correctly require admin/manager). Add `requireAnyRole(["admin",
  "manager"])`.
- `GET /api/categories/[id]` — no `requireAdmin()`, even though
  `features/categories/api/index.ts` documents `getCategoryById` as
  "admin only" and the file's own PATCH/DELETE already call
  `requireAdmin()`. Add it to GET.
- `GET /api/restaurants` — POST requires admin, GET has no check at all. Add
  `requireAnyRole(["admin", "manager"])` (confirm exact role set against
  what the page consuming this route needs).
- `GET /api/profile`, `GET /api/subscriptions/me` — no explicit session
  check; currently relies on `apiClient()` throwing when unauthenticated,
  which is swallowed into a generic 500 instead of a proper 401. Add an
  explicit `requireAuth()` at the top of each so the failure mode is correct
  and doesn't silently change if the underlying `*Api` helper is ever
  swapped to `publicApiClient`.

### 1.6 Stale role survives demotion

`lib/auth/refresh.ts`: refresh only updates `accessToken`/`expiresAt`;
`session.user.role` is never re-validated, so a demoted user keeps their old
(possibly more privileged) role until they explicitly log out — which, since
refresh is proactive, can be effectively forever.

**Fix**: during refresh, also fetch `/auth/me` (same call already made at
login) and update `session.user` alongside the tokens. This runs once per
~14-minute refresh cycle, not per-request, so it doesn't add meaningful
request volume.

## Phase 2 — Validation & platform headers

### 2.1 Raw JSON bodies instead of `readJsonBody(schema)`

Add a Zod schema + `readJsonBody` to each of the following (pattern to copy:
`app/api/ingredients/route.ts` or `app/api/orders/[id]/status/route.ts`,
which already do this correctly):

- `app/api/purchase-orders/[id]/status/route.ts`
- `app/api/inventory/batches/route.ts`
- `app/api/inventory/transactions/route.ts`
- `app/api/inventory/waste-events/route.ts`
- `app/api/purchase-orders/route.ts`
- `app/api/suppliers/route.ts`
- `app/api/offers/route.ts` and `app/api/offers/[id]/route.ts`
- `app/api/products/[id]/availability/route.ts`
- `app/api/partnership-applications/submit/route.ts` and
  `app/api/partnership-applications/[id]/reject/route.ts`

### 2.2 File upload validation

`app/api/imports/route.ts`: only checks `formData.get("file") instanceof
File`. Add an extension/MIME allowlist and a size cap before forwarding
upstream.

### 2.3 Status code correctness

`app/api/partnership-applications/**`: role-mismatch failures currently
return 401; change to 403 to match `route-helpers.ts` conventions
(401 = not authenticated, 403 = authenticated but forbidden).

### 2.4 Security headers

Add a `headers()` function to `next.config.ts` (native Next.js feature, no
dependency) applying to all routes:

- `Content-Security-Policy` (start restrictive, allow only the known image
  hosts already in `next.config.ts`'s `remotePatterns` plus the API origin
  for fetches; adjust once real violations are observed in dev)
- `Strict-Transport-Security` (prod only)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (deny geolocation/camera/microphone by default —
  none of the current features use them)
- `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`)

## Phase 3 — Redundant request cleanup

### 3.1 `useNotifications` bypasses react-query

`features/notifications/hooks/useNotifications.ts` hand-rolls
`useState`/`useEffect` fetching (no cache), mounted independently by the
header dropdown (every dashboard page) and the notifications page — each
fires its own list + unread-count requests. Every `fetchNotifications()`
call also unconditionally re-fetches the unread count.

**Fix**: rewrite onto `@tanstack/react-query` (the pattern every other
feature already uses — see `providers/getQuery.ts` for the shared
defaults), with a stable query key so the dropdown and the notifications
page share one cache entry. Split unread-count into its own query, only
invalidated when an action actually changes it (mark-as-read, new
notification via socket), not on every list fetch.

### 3.2 Assistant chat over-invalidates

`features/assistant/hooks/use-assistant-chat.ts` calls
`qc.invalidateQueries()` with no key on every approved action, refetching
every active query app-wide. Scope it to the specific query key(s) affected
by that action.

### 3.3 Duplicate current-user fetch

Header components (`components/common/Navbar.tsx`, `site-header.tsx`,
`user-dropdown.tsx`) fetch `/profile` separately even though the session
user is already loaded via `/api/auth/me` on app mount
(`providers/auth-provider.tsx`). Use the already-loaded session user instead
of a second fetch, unless the header genuinely needs fresher/more detailed
profile data than the session carries — confirm during implementation.

## Testing

- Phase 1: for each newly-gated route/action, one test (or manual curl/browser
  check) proving an unauthorized role gets 401/403 and an authorized role
  still succeeds. For 1.1, specifically verify an admin-only dashboard page
  visited directly by a `staff` session is blocked server-side (check the
  network response, not just the rendered UI).
- Phase 2: one invalid-payload test per newly-validated route (400 on bad
  shape), one oversized/wrong-type file test for imports, and a manual check
  that security headers are present on a response (`curl -I`).
- Phase 3: manual verification in the browser (React Query devtools or
  network tab) that visiting the notifications dropdown + page together
  fires one shared request, not two independent ones.

## Out of scope

- Rate limiting (revisit if the app moves to multi-instance deployment).
- Backend (`RestoMindAPI`) changes — this pass only touches `restomind-app`.
- Any route/action not flagged above; the audit was targeted, not
  exhaustive, so unrelated files are left untouched.
