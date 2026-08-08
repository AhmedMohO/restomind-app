# Security & Request-Management Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the privilege-escalation and missing-validation bugs found in `restomind-app`'s API routes and Server Actions, add security headers, and stop the confirmed source of duplicate frontend requests — using only patterns and helpers that already exist in this codebase.

**Architecture:** No new abstractions. Every route fix reuses `requireAuth`/`requireAnyRole`/`requireSessionUser`/`requireAdmin`/`readJsonBody` from `lib/api/route-helpers.ts` (route handlers) or `requireRole` from `lib/auth/auth.ts` (Server Components/Actions) — the same helpers already used correctly elsewhere in the file tree. New Zod schemas follow the existing `schemas/*.ts` + `readJsonBody(request, schema)` convention (see `schemas/ingredient.ts` / `app/api/ingredients/route.ts` for the reference pattern). The notifications hook is re-implemented on `@tanstack/react-query`, the library already used by every other feature.

**Tech Stack:** Next.js 16 (App Router, Route Handlers, Server Actions), TypeScript, Zod v4, iron-session, `@tanstack/react-query` v5, Bun (`bun:test` for unit tests).

## Global Constraints

- Every mutating route handler must derive the caller's identity from the session (`requireAuth`/`requireAnyRole`/`requireSessionUser`), never trust a client-supplied `role`/`restaurantId`/`userId` field for authorization decisions.
- New Zod schemas live under `schemas/` and are consumed via `readJsonBody(request, schema)` from `lib/api/route-helpers.ts` — do not hand-roll `request.json()` + manual field checks for new code.
- This codebase has no route-handler test harness (only pure-function `bun:test` files exist: `lib/phone.test.ts`, `lib/utils.test.ts`). For route handlers and Server Actions, verification is a manual dev-server + `curl`/browser check (documented per task) rather than an invented mocking harness — do not add new test infrastructure/dependencies for this. For pure logic (Zod schemas, `getRouteRoles`), write real `bun:test` unit tests next to the source file, matching the existing `*.test.ts` convention.
- Preserve every route handler's existing response envelope shape (`ApiResponse<T>` — `{ success, data }` / `{ success, error, message }`) and existing status-code conventions (`jsonSuccess`, `handleServerError`, `handleUpstreamError`) unless a task explicitly says to change them.
- Rate limiting is out of scope for this plan (confirmed with the user — single-instance app, revisit if that changes).

---

## Task 1: Fix `ROUTE_ROLE_MAP` prefix matching and complete missing entries

`getRouteRoles()` in `lib/auth/config.ts` iterates `Object.entries(ROUTE_ROLE_MAP)` and returns the **first** prefix match in insertion order — not the longest/most-specific match. Two entries are silently dead code today because a broader prefix is listed earlier in the object: `"/dashboard/offers/new": ["manager"]` is unreachable because `"/dashboard/offers": ["admin","manager","staff"]` is listed first and also matches (`"/dashboard/offers/new".startsWith("/dashboard/offers")` is `true`), so every visitor to the offers-creation page gets the broader list. Same bug for `"/dashboard/products/new"`. Separately, `/dashboard/admin/settings` (platform-wide settings toggle) and `/dashboard/admin/plans` have no entry at all, so they fall through to the generic `"/dashboard"` catch-all (`admin`/`manager`/`staff`) even though only `admin` should reach them.

**Files:**
- Modify: `lib/auth/config.ts:120-127` (`getRouteRoles`), `lib/auth/config.ts:83-113` (`ROUTE_ROLE_MAP`)
- Test: `lib/auth/config.test.ts` (new)

**Interfaces:**
- Consumes: nothing new.
- Produces: `getRouteRoles(path: string): UserRole[] | null` — behavior change only (longest-prefix-wins instead of first-listed-wins); signature unchanged, used by Task 2.

- [ ] **Step 1: Write the failing test**

```ts
// lib/auth/config.test.ts
import { describe, expect, test } from "bun:test"
import { getRouteRoles } from "./config"

describe("getRouteRoles", () => {
  test("resolves the more specific prefix even when a broader prefix is listed first in the map", () => {
    expect(getRouteRoles("/en/dashboard/offers/new")).toEqual(["manager"])
    expect(getRouteRoles("/en/dashboard/products/new")).toEqual(["admin", "manager"])
  })

  test("resolves newly-added admin-only settings and plans pages", () => {
    expect(getRouteRoles("/en/dashboard/admin/settings")).toEqual(["admin"])
    expect(getRouteRoles("/en/dashboard/admin/plans")).toEqual(["admin"])
  })

  test("still resolves the generic dashboard catch-all for unlisted pages", () => {
    expect(getRouteRoles("/en/dashboard/billing")).toEqual(["admin", "manager", "staff"])
  })

  test("still resolves unrelated broader prefixes correctly", () => {
    expect(getRouteRoles("/en/dashboard/offers/123")).toEqual(["admin", "manager", "staff"])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/auth/config.test.ts`
Expected: FAIL on the `offers/new` / `products/new` / `admin/settings` / `admin/plans` assertions (current behavior returns the broader `["admin","manager","staff"]` or `null` instead).

- [ ] **Step 3: Fix `getRouteRoles` to match the longest (most specific) prefix, and add the missing map entries**

In `lib/auth/config.ts`, replace the `getRouteRoles` function:

```ts
export function getRouteRoles(path: string): UserRole[] | null {
  // Strip optional locale segment (e.g. /en/dashboard → /dashboard)
  const normalised = path.replace(/^\/[a-z]{2}(\/|$)/, "/")
  // Longest-prefix-wins: object insertion order must not decide precedence,
  // otherwise a broader prefix listed earlier (e.g. "/dashboard/offers")
  // silently shadows a more specific one listed later ("/dashboard/offers/new").
  const byLengthDesc = Object.entries(ROUTE_ROLE_MAP).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [prefix, roles] of byLengthDesc) {
    if (normalised.startsWith(prefix)) return [...roles] as UserRole[]
  }
  return null
}
```

Add these entries to `ROUTE_ROLE_MAP` (anywhere in the object — order no longer matters):

```ts
  "/dashboard/admin/settings": ["admin"],
  "/dashboard/admin/plans": ["admin"],
  "/dashboard/notifications": ["admin", "manager"],
  "/dashboard/restaurants": ["admin", "manager"],
  "/dashboard/purchase-orders/new": ["admin", "manager"],
```

Add a comment above `ROUTE_ROLE_MAP` documenting the known remaining limitation (dynamic `[id]` segments can't be expressed as a string prefix):

```ts
/**
 * Route prefix → required roles.
 * An empty array means "any authenticated user" (auth-only).
 * Routes not listed here are public.
 *
 * Known limitation: prefixes can't express a stricter role for a dynamic
 * `[id]` sub-path than its parent list page (e.g. `/dashboard/restaurants`
 * allows admin+manager, but `/dashboard/restaurants/:id` and `/:id/edit` are
 * admin-only per their DashboardAuthGuard). Closing that gap needs a real
 * path-pattern matcher (e.g. path-to-regexp), not a bigger prefix table —
 * out of scope here. The client-side DashboardAuthGuard on those pages still
 * enforces the tighter check; only server-rendered data for the broader role
 * range is the residual exposure.
 */
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/auth/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth/config.ts lib/auth/config.test.ts
git commit -m "fix(auth): resolve ROUTE_ROLE_MAP by longest-prefix match, add missing admin-only entries"
```

---

## Task 2: Make `dashboard/layout.tsx` pass the real visited path to `ProtectedRoute`

`app/[locale]/dashboard/layout.tsx` calls `<ProtectedRoute route={`/${locale}/dashboard`}>` with a hardcoded route string regardless of which dashboard page is being visited. `ProtectedRoute` correctly resolves per-page roles via `getRouteRoles(route)` — it just never receives the real path, so every dashboard page is gated server-side only by the coarse `DASHBOARD_ALLOWED_ROLES`. `proxy.ts` already computes the real pathname into an `x-pathname` response header for exactly this purpose (`intlResponse.headers.set("x-pathname", pathname)`), but nothing reads it server-side.

**Files:**
- Modify: `app/[locale]/dashboard/layout.tsx:25-60`

**Interfaces:**
- Consumes: `ProtectedRoute` (`route?: string` prop, unchanged signature), `getRouteRoles` from Task 1 (unchanged signature).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Manually verify the current (broken) behavior**

Run the dev server (`bun dev`), log in as a `staff` user, and directly navigate to `/en/dashboard/categories` (admin-only per `ROUTE_ROLE_MAP`). Confirm the page's server-rendered HTML/RSC payload for `/dashboard/categories` is currently sent before any client-side redirect fires (inspect the Network tab's document/RSC response body, not just what's visually rendered) — this confirms the layout is not enforcing the per-page role server-side.

- [ ] **Step 2: Read the real pathname and pass it to `ProtectedRoute`**

In `app/[locale]/dashboard/layout.tsx`, add the `headers()` import and read `x-pathname`:

```tsx
import React, { Suspense } from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import { routing } from "@/i18n/routing"
import { setRequestLocale } from "next-intl/server"
import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { AssistantWidget } from "@/features/assistant/components/assistant-widget"
import SubscriptionGate from "@/features/subscription/components/SubscriptionGate"
import {
  getMySubscription,
  hasDashboardAccess,
} from "@/features/subscription/api"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Dashboard layout — protected by role via ProtectedRoute.
 *
 * The real visited path (set by proxy.ts as the `x-pathname` header) is
 * passed through so ProtectedRoute resolves the PER-PAGE role from
 * ROUTE_ROLE_MAP, not just the generic /dashboard role set. Falls back to
 * `/${locale}/dashboard` if the header is missing (e.g. direct server-side
 * invocation outside the normal request path).
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale

  setRequestLocale(safeLocale)

  const requestHeaders = await headers()
  const currentPath = requestHeaders.get("x-pathname") ?? `/${locale}/dashboard`

  let needsSubscription = false
  try {
    const subscription = await getMySubscription()
    needsSubscription = !hasDashboardAccess(subscription.state)
  } catch {
    needsSubscription = false
  }

  return (
    <Suspense>
      <ProtectedRoute locale={safeLocale} route={currentPath}>
        <AppSidebar needsSubscription={needsSubscription}>
          {/* Resolved once here, so every dashboard page — present and
              future — is covered without per-page work. */}
          <SubscriptionGate locale={safeLocale}>{children}</SubscriptionGate>
        </AppSidebar>
        {/* Fixed-position, so it floats over every dashboard page. */}
        <AssistantWidget />
      </ProtectedRoute>
    </Suspense>
  )
}
```

- [ ] **Step 3: Manually verify the fix**

Restart the dev server. Repeat Step 1: log in as `staff`, navigate directly to `/en/dashboard/categories`. Expected: server-side redirect to `/en` (unauthorized) — confirm via the Network tab that the response for the navigation is a redirect, not the categories page content. Then log in as `admin` and confirm `/en/dashboard/categories` still renders normally. Also spot-check `/en/dashboard/admin/settings` as `manager` (should redirect) and as `admin` (should render).

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/dashboard/layout.tsx"
git commit -m "fix(auth): enforce per-page dashboard roles server-side using the real request path"
```

---

## Task 3: Gate and validate `/api/users` (GET + POST) — fixes unauthenticated self-elevation to admin

`app/api/users/route.ts` GET has no role check (any authenticated user, including `customer`, can list all users). POST has no role check either, and casts the raw body `as CreateUserPayload` with no validation — a logged-in customer can POST `{ role: "admin", ... }` and self-promote. `schemas/user.ts` already has `createUserSchema` (requires `role`); it doesn't yet stop a non-admin caller from setting `role`/`restaurantId` to something above their own privilege — that check has to happen in the route handler, after shape validation, because Zod alone doesn't know who the caller is.

**Files:**
- Modify: `app/api/users/route.ts`
- Test: manual (see Step 1/4)

**Interfaces:**
- Consumes: `requireAnyRole`, `readJsonBody`, `jsonSuccess`, `handleUpstreamError` from `lib/api/route-helpers.ts`; `createUserSchema` from `schemas/user.ts`; `getUsers`, `createUser` from `features/users/api`.
- Produces: nothing new for later tasks (Task 4 follows the same privilege-restriction pattern independently).

- [ ] **Step 1: Manually verify the current (broken) behavior**

With the dev server running, log in as a `customer` and run:

```bash
curl -i -b "session=<customer session cookie>" http://localhost:3000/api/users
curl -i -b "session=<customer session cookie>" -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Eve","lastName":"Hacker","email":"eve@example.com","phone":"+201012345678","role":"admin"}'
```

Expected (current, broken): both return `200`/`201`, not `401`/`403`.

- [ ] **Step 2: Rewrite the route with role gating and privilege-restricted validation**

```ts
import { connection } from "next/server"
import {
  createUser,
  getUsers,
  type ApiUser,
  type PaginatedUsers,
} from "@/features/users/api"
import {
  handleServerError,
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { createUserSchema } from "@/schemas/user"

const USER_ROLES = ["admin", "manager"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(USER_ROLES)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const search = searchParams.get("search") ?? undefined
  const role = searchParams.get("role") ?? undefined

  try {
    const data = await getUsers({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(search ? { search } : {}),
      ...(role ? { role: role as "admin" | "manager" | "customer" | "staff" } : {}),
    })
    return jsonSuccess<PaginatedUsers>(data)
  } catch (err) {
    console.error("[api/users] GET failed", err)
    return handleUpstreamError(err, "Failed to fetch users")
  }
}

export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(USER_ROLES)
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, createUserSchema)
  if (!parsed.ok) return parsed.response

  const body = parsed.data

  if (auth.user.role !== "admin") {
    if (body.role === "admin" || body.role === "manager") {
      return handleServerError(
        "Only an admin can assign the admin or manager role",
        "Only an admin can assign the admin or manager role",
        403
      )
    }
    body.restaurantId = auth.user.restaurantId ?? null
  }

  try {
    const res = await createUser(body)
    return jsonSuccess<ApiUser>(res.data, 201)
  } catch (err) {
    console.error("[api/users] POST failed", err)
    return handleUpstreamError(err, "Failed to create user")
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: no new errors. (`createUserSchema`'s inferred type must be assignable to `CreateUserPayload` expected by `createUser` — if `bun run typecheck` reports a mismatch, align the schema/payload field names before continuing; do not `as any` around it.)

- [ ] **Step 4: Manually verify the fix**

Repeat Step 1's two `curl` calls as `customer`: expect `403` on GET, `403` on POST. Then repeat as `manager`: GET should succeed; POST with `role: "staff"` should succeed and the created user's `restaurantId` should be the manager's own, even if a different `restaurantId` was included in the request body; POST with `role: "admin"` should return `403`. Then repeat as `admin`: both should succeed with the body's values respected as-is.

- [ ] **Step 5: Commit**

```bash
git add app/api/users/route.ts
git commit -m "fix(auth): gate /api/users behind admin/manager role and block role/restaurantId self-escalation"
```

---

## Task 4: Validate and lock down `PATCH /api/users/[id]`

The route already checks `role === "admin" || role === "manager"`, but reads the body raw (`as UpdateUserPayload`) with no schema, so a manager can PATCH another user's `role` to `admin` or move them to a different `restaurantId`. Apply the same schema + privilege-restriction pattern as Task 3.

**Files:**
- Modify: `app/api/users/[id]/route.ts:50-103` (PATCH only — GET is handled in Task 5, DELETE is already correctly admin-gated and unchanged)

**Interfaces:**
- Consumes: `updateUserSchema` from `schemas/user.ts`, `requireSessionUser`/`readJsonBody`/`handleServerError`/`handleUpstreamError` from `lib/api/route-helpers.ts`.
- Produces: nothing new.

- [ ] **Step 1: Manually verify the current (broken) behavior**

Log in as a `manager`, PATCH a user in a different restaurant with an elevated role:

```bash
curl -i -b "session=<manager cookie>" -X PATCH http://localhost:3000/api/users/<other-restaurant-user-id> \
  -H "Content-Type: application/json" \
  -d '{"firstName":"X","lastName":"Y","role":"admin","restaurantId":"<some-other-restaurant-id>"}'
```

Expected (current, broken): `200` with the role/restaurantId change applied upstream.

- [ ] **Step 2: Replace the PATCH handler**

```ts
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["admin", "manager"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, updateUserSchema)
  if (!parsed.ok) return parsed.response

  const body = parsed.data

  if (auth.user.role !== "admin") {
    if (body.role === "admin" || body.role === "manager") {
      return handleServerError(
        "Only an admin can assign the admin or manager role",
        "Only an admin can assign the admin or manager role",
        403
      )
    }
    body.restaurantId = auth.user.restaurantId ?? null
  }

  const { id } = await params

  try {
    const res = await updateUser(id, body)
    const userData = (res as Record<string, unknown>)?.data ?? res
    return NextResponse.json<ApiResponse<ApiUser>>(
      { success: true, data: userData as ApiUser },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/users/[id]] PATCH failed", err)
    const status = err instanceof ApiError ? err.statusCode : 500
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "UPDATE_FAILED",
        message: err instanceof Error ? err.message : "Failed to update user",
      },
      { status }
    )
  }
}
```

Add `readJsonBody`, `requireSessionUser` to the `@/lib/api/route-helpers` import and `updateUserSchema` to a new `import { updateUserSchema } from "@/schemas/user"` at the top of `app/api/users/[id]/route.ts`. Leave GET (Task 5) and DELETE untouched in this task.

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck` — expect no new errors.

- [ ] **Step 4: Manually verify the fix**

Repeat Step 1 as `manager`: expect `403`. Repeat with `role: "staff"` (no role escalation) and a different `restaurantId` in the body while logged in as `manager`: expect `200`, and confirm the updated user's `restaurantId` is the manager's own restaurant, not the one submitted in the body. Repeat as `admin`: expect the submitted `role`/`restaurantId` to be respected as-is.

- [ ] **Step 5: Commit**

```bash
git add "app/api/users/[id]/route.ts"
git commit -m "fix(auth): validate PATCH /api/users/[id] body and block manager role/restaurantId escalation"
```

---

## Task 5: Add missing auth checks to `/api/users/[id]` GET, `/api/categories/[id]` GET, `/api/restaurants` GET, `/api/profile`, `/api/subscriptions/me`

Five routes are missing an explicit auth/role check that their sibling handlers in the same file (or the feature's own doc comments) already establish as required.

**Files:**
- Modify: `app/api/users/[id]/route.ts:13-48` (GET only)
- Modify: `app/api/categories/[id]/route.ts:5-18` (GET only)
- Modify: `app/api/restaurants/route.ts:8-38` (GET only)
- Modify: `app/api/profile/route.ts`
- Modify: `app/api/subscriptions/me/route.ts`

**Interfaces:**
- Consumes: `requireAnyRole`, `requireAdmin`, `requireAuth` from `lib/api/route-helpers.ts`.
- Produces: nothing new.

- [ ] **Step 1: Manually verify current (broken) behavior**

As a `customer`, confirm all five currently return `200` (should be `401`/`403` for the four dashboard-only ones; `/api/profile` should require any authenticated session):

```bash
curl -i -b "session=<customer cookie>" http://localhost:3000/api/users/<any-id>
curl -i -b "session=<customer cookie>" http://localhost:3000/api/categories/<any-id>
curl -i -b "session=<customer cookie>" http://localhost:3000/api/restaurants
curl -i http://localhost:3000/api/profile
curl -i http://localhost:3000/api/subscriptions/me
```

- [ ] **Step 2a: `app/api/users/[id]/route.ts` GET**

Add role gating matching PATCH/DELETE in the same file:

```ts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole(["admin", "manager"])
  if (authError) return authError

  const { id } = await params

  try {
    const res = await getUserById(id)
    const userData = (res as Record<string, unknown>)?.data ?? res
    return NextResponse.json<ApiResponse<ApiUser>>(
      { success: true, data: userData as ApiUser },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/users/[id]] GET failed", err)
    const status = err instanceof ApiError ? err.statusCode : 404
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "NOT_FOUND",
        message: err instanceof Error ? err.message : "User not found",
      },
      { status }
    )
  }
}
```

Add `requireAnyRole` to the existing `@/lib/api/route-helpers` import (create the import if not already present) and remove the now-unused `getSession` import if GET no longer needs it directly (PATCH/DELETE in this file still use their own inline session checks per Task 4 / existing code — keep `getSession` imported if still referenced elsewhere in the file).

- [ ] **Step 2b: `app/api/categories/[id]/route.ts` GET**

```ts
import { connection } from "next/server"
import { deleteCategory, getCategoryById, updateCategory } from "@/features/categories/api"
import { handleServerError, jsonSuccess, requireAdmin } from "@/lib/api/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const { id } = await params

  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const res = await getCategoryById(id)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Category not found", 404)
  }
}

// PATCH and DELETE unchanged below
```

- [ ] **Step 2c: `app/api/restaurants/route.ts` GET**

```ts
export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(["admin", "manager"])
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const search = searchParams.get("search") ?? undefined

  try {
    const data = await getRestaurants({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(search ? { search } : {}),
    })
    return NextResponse.json<ApiResponse<PaginatedRestaurants>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/restaurants] GET failed", err)
    return handleUpstreamError(err, "Failed to fetch restaurants")
  }
}
```

Add `requireAnyRole` to the `@/lib/api/route-helpers` import; the `getSession`/inline check this replaces can be removed from GET (POST below it keeps its own existing check, untouched).

- [ ] **Step 2d: `app/api/profile/route.ts`**

```ts
import { NextResponse, connection } from "next/server"
import { getProfileApi } from "@/features/profile/api/profile"
import type { ApiResponse } from "@/features/auth/auth"
import type { FullUser } from "@/features/profile/api/profile"
import { requireAuth } from "@/lib/api/route-helpers"

export async function GET() {
  await connection()

  const authError = await requireAuth()
  if (authError) return authError

  try {
    const user = await getProfileApi()
    return NextResponse.json<ApiResponse<FullUser>>(
      { success: true, data: user },
      { status: 200 }
    )
  } catch (error) {
    console.error("[api/profile] Unexpected error", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to retrieve profile",
      },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2e: `app/api/subscriptions/me/route.ts`**

```ts
import { NextResponse, connection } from "next/server"
import { getMySubscription } from "@/features/subscription/api"
import type { ApiResponse } from "@/features/auth/auth"
import type { MySubscription } from "@/features/subscription/api/type"
import { requireAuth } from "@/lib/api/route-helpers"

export async function GET() {
  await connection()

  const authError = await requireAuth()
  if (authError) return authError

  try {
    const subscription = await getMySubscription()
    return NextResponse.json<ApiResponse<MySubscription>>(
      { success: true, data: subscription },
      { status: 200 }
    )
  } catch (error) {
    console.error("[api/subscriptions/me] Unexpected error", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve subscription details",
      },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck` — expect no new errors.

- [ ] **Step 4: Manually verify the fix**

Repeat Step 1's five `curl` calls unauthenticated / as `customer`: expect `401` for `/api/profile` and `/api/subscriptions/me` (any authenticated user should still succeed with a valid session), and `401`/`403` for the other three as a `customer`. Then confirm `admin`/`manager` sessions still get `200` from `/api/users/[id]`, `/api/categories/[id]`, `/api/restaurants`, and any authenticated session still gets `200` from `/api/profile` and `/api/subscriptions/me`.

- [ ] **Step 5: Commit**

```bash
git add "app/api/users/[id]/route.ts" "app/api/categories/[id]/route.ts" app/api/restaurants/route.ts app/api/profile/route.ts app/api/subscriptions/me/route.ts
git commit -m "fix(auth): add missing auth/role checks on users/categories/restaurants/profile/subscription reads"
```

---

## Task 6: Gate system-settings Server Actions with `requireRole(["admin"])`

`features/system-settings/actions.ts` has zero server-side role check — only the client `DashboardAuthGuard` on the settings page hides the UI. The action itself is directly callable by any authenticated user (Server Actions are POST-able endpoints under the hood; hiding the button does not stop a direct call).

**Files:**
- Modify: `features/system-settings/actions.ts`

**Interfaces:**
- Consumes: `requireRole` from `lib/auth/auth.ts` (already used by `ProtectedRoute`), `AuthorizationError`/`AuthenticationError` from `lib/auth/errors.ts`.
- Produces: nothing new.

- [ ] **Step 1: Manually verify the current (broken) behavior**

Log in as a non-admin (`manager`) and, from the browser console on any dashboard page, invoke the action indirectly by navigating to `/en/dashboard/admin/settings` — with Task 1/2 already applied this page now server-redirects a manager away, so instead verify the action itself has no guard by temporarily reading `features/system-settings/actions.ts` and confirming there is no `requireRole`/`requireAuth` call before `getSystemSettings()`/`updateSystemSettings()` — this is a code-inspection check, not a runtime one, since Task 2 already closes the page-level access path; the action-level gate below is defense in depth for any other caller of the action.

- [ ] **Step 2: Add the role gate**

```ts
"use server"

import { requireRole } from "@/lib/auth/auth"
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors"
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettings,
  type SystemSettingsUpdate,
} from "./api"

/** Server Action: read the platform switches. Admin-only. */
export async function fetchSystemSettingsAction(): Promise<SystemSettings | null> {
  try {
    await requireRole(["admin"])
    return await getSystemSettings()
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      console.warn("[fetchSystemSettingsAction] Unauthorized access attempt", error.message)
      return null
    }
    console.error("[fetchSystemSettingsAction]", error)
    return null
  }
}

/**
 * Server Action: change one or more switches. Admin-only.
 *
 * Errors are returned rather than thrown so the panel can put the toggle back
 * where it was and say why. A switch that silently appears to have flipped
 * when it did not is worse than an error — an admin would walk away believing
 * trials are off while every new merchant still gets one.
 */
export async function updateSystemSettingsAction(
  body: SystemSettingsUpdate
): Promise<{ settings: SystemSettings } | { error: string }> {
  try {
    await requireRole(["admin"])
    return { settings: await updateSystemSettings(body) }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return { error: "You do not have permission to change system settings." }
    }
    console.error("[updateSystemSettingsAction]", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save the setting. Please try again.",
    }
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck` — expect no new errors.

- [ ] **Step 4: Manually verify the fix**

With a `manager` session, call `fetchSystemSettingsAction()` (e.g. temporarily invoke it from a test page, or confirm via the settings page — which now also 403s at the layout level from Task 2) — confirm it resolves to `null` rather than the real settings object. As `admin`, confirm both actions still work end-to-end from the settings UI.

- [ ] **Step 5: Commit**

```bash
git add features/system-settings/actions.ts
git commit -m "fix(auth): require admin role inside system-settings Server Actions, not just the client guard"
```

---

## Task 7: Re-validate role on token refresh (fix stale-role-after-demotion)

`lib/auth/refresh.ts` only updates `accessToken`/`expiresAt` on refresh; `session.user.role` is never re-checked, so a demoted user keeps their old (possibly more privileged) role until they explicitly log out — and since refresh is proactive (every ~14 minutes), that can persist indefinitely.

**Files:**
- Modify: `lib/auth/refresh.ts`

**Interfaces:**
- Consumes: `saveSession` from `lib/auth/session.ts` (already exported, not currently imported here), `MeApiUser` type from `features/auth/auth.ts`.
- Produces: nothing new — `refreshSession()`'s signature and return type (`Promise<string>`) are unchanged.

- [ ] **Step 1: Manually verify the current (broken) behavior**

Log in as a `manager`. While the session is active, have an admin demote that user to `customer` via the backend directly (or `PATCH /api/users/[id]` as admin). Wait for the access token to naturally refresh (or force it by waiting past `ACCESS_TOKEN_TTL_MS - REFRESH_BUFFER_MS`), then hit a manager-only route (e.g. `GET /api/orders`). Expected (current, broken): still succeeds with the stale `manager` role.

- [ ] **Step 2: Re-fetch `/auth/me` alongside the token refresh**

```ts
import "server-only"

import { API_URL } from "./config"
import { AuthenticationError, RefreshTokenExpiredError } from "./errors"
import {
  getSession,
  saveSession,
  updateTokens,
  destroySession,
  computeExpiresAt,
} from "./session"
import type { MeApiUser } from "@/features/auth/auth"

// ... (refreshLock declaration unchanged) ...

export async function refreshSession(
  existingSession?: Awaited<ReturnType<typeof getSession>>
): Promise<string> {
  if (refreshLock !== null) {
    return await refreshLock
  }

  let resolve!: (token: string) => void
  let reject!: (err: unknown) => void

  refreshLock = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })

  try {
    const session = existingSession ?? (await getSession())

    if (!session.isLoggedIn || !session.tokens?.refreshToken) {
      throw new AuthenticationError("No refresh token available")
    }

    const { refreshToken } = session.tokens

    console.info("[auth] Refreshing access token")

    const response = await fetch(`${API_URL}/auth/generate-access-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string
      }
      console.error("[auth] Refresh failed", { status: response.status, body })

      await destroySession(session)

      if (response.status === 401) {
        throw new RefreshTokenExpiredError()
      }

      throw new AuthenticationError(
        body.message ?? "Failed to refresh access token"
      )
    }

    const data = (await response.json()) as { accessToken?: string }

    if (!data.accessToken) {
      await destroySession(session)
      throw new AuthenticationError("Invalid refresh response from server")
    }

    await updateTokens(session, {
      accessToken: data.accessToken,
      refreshToken: session.tokens.refreshToken,
      expiresAt: computeExpiresAt(),
    })

    // Re-validate the cached role/profile alongside the token — a role
    // change (e.g. demotion) must not persist past the next refresh cycle.
    // Non-fatal: if this call fails, the refresh itself still succeeded and
    // the user keeps their previous (possibly stale) role until the next
    // refresh attempt rather than being logged out over a transient error.
    try {
      const meResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.accessToken}` },
        cache: "no-store",
      })
      if (meResponse.ok) {
        const apiUser = (await meResponse.json()) as MeApiUser
        session.user = {
          _id: apiUser._id,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          email: apiUser.email,
          role: apiUser.role,
          isEmailVerified: apiUser.isEmailVerified,
          restaurantId: apiUser.restaurantId,
        }
        await saveSession(session)
      }
    } catch (err) {
      console.warn("[auth] Role revalidation on refresh failed (non-fatal)", err)
    }

    console.info("[auth] Access token refreshed successfully")
    resolve(data.accessToken)
    return data.accessToken
  } catch (error) {
    reject(error)
    throw error
  } finally {
    refreshLock = null
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck` — expect no new errors.

- [ ] **Step 4: Manually verify the fix**

Repeat Step 1: after the demotion and the next refresh cycle, the manager-only route now returns `403` for the demoted session.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/refresh.ts
git commit -m "fix(auth): re-validate cached session role from /auth/me on every token refresh"
```

---

## Task 8: Zod-validate purchase-order routes

`app/api/purchase-orders/route.ts` POST and `app/api/purchase-orders/[id]/status/route.ts` PATCH read the raw JSON body with no schema.

**Files:**
- Create: `schemas/purchase-order.ts`
- Test: `schemas/purchase-order.test.ts`
- Modify: `app/api/purchase-orders/route.ts` (POST only)
- Modify: `app/api/purchase-orders/[id]/status/route.ts`

**Interfaces:**
- Produces: `createPurchaseOrderSchema`, `updatePurchaseOrderStatusSchema` (both exported from `schemas/purchase-order.ts`), consumed only by the two routes above.

- [ ] **Step 1: Write the failing test**

```ts
// schemas/purchase-order.test.ts
import { describe, expect, test } from "bun:test"
import { createPurchaseOrderSchema, updatePurchaseOrderStatusSchema } from "./purchase-order"

describe("createPurchaseOrderSchema", () => {
  test("accepts a valid purchase order", () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: "64f0000000000000000000aa",
      items: [{ ingredientId: "64f0000000000000000000bb", quantity: 5, unit: "kg", unitCost: 12.5 }],
    })
    expect(result.success).toBe(true)
  })

  test("rejects an empty items array", () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: "64f0000000000000000000aa",
      items: [],
    })
    expect(result.success).toBe(false)
  })

  test("rejects a negative quantity", () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: "64f0000000000000000000aa",
      items: [{ ingredientId: "64f0000000000000000000bb", quantity: -1, unit: "kg", unitCost: 1 }],
    })
    expect(result.success).toBe(false)
  })
})

describe("updatePurchaseOrderStatusSchema", () => {
  test("accepts a known status", () => {
    expect(updatePurchaseOrderStatusSchema.safeParse({ status: "sent" }).success).toBe(true)
  })

  test("rejects an unknown status", () => {
    expect(updatePurchaseOrderStatusSchema.safeParse({ status: "bogus" }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test schemas/purchase-order.test.ts`
Expected: FAIL — `./purchase-order` module does not exist yet.

- [ ] **Step 3: Create the schema file**

```ts
// schemas/purchase-order.ts
import { z } from "zod"

export const purchaseOrderStatusEnum = z.enum(["draft", "sent", "received", "cancelled"])

export const createPurchaseOrderItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unitCost: z.number().nonnegative(),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  items: z.array(createPurchaseOrderItemSchema).min(1, { message: "At least one item is required" }),
  status: purchaseOrderStatusEnum.optional(),
  expectedDeliveryDate: z.string().optional(),
})

export const updatePurchaseOrderStatusSchema = z.object({
  status: purchaseOrderStatusEnum,
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test schemas/purchase-order.test.ts`
Expected: PASS

- [ ] **Step 5: Wire the schemas into the two routes**

`app/api/purchase-orders/route.ts` POST:

```ts
import { connection } from "next/server"

import {
  createPurchaseOrder,
  getPurchaseOrders,
} from "@/features/purchase-orders/api"
import type { PurchaseOrderStatus } from "@/features/purchase-orders/types"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { createPurchaseOrderSchema } from "@/schemas/purchase-order"

const MANAGER_ROLES = ["manager", "admin"] as const
const PO_READ_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  // unchanged — see existing file
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, createPurchaseOrderSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createPurchaseOrder(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create purchase order")
  }
}
```

`app/api/purchase-orders/[id]/status/route.ts`:

```ts
import { connection } from "next/server"

import { updatePurchaseOrderStatus } from "@/features/purchase-orders/api"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { updatePurchaseOrderStatusSchema } from "@/schemas/purchase-order"

const MANAGER_ROLES = ["manager", "admin"] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, updatePurchaseOrderStatusSchema)
  if (!parsed.ok) return parsed.response

  const { id } = await params

  try {
    const res = await updatePurchaseOrderStatus(id, parsed.data.status)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update purchase order status")
  }
}
```

- [ ] **Step 6: Typecheck**

Run: `bun run typecheck` — expect no new errors (confirm `createPurchaseOrderSchema`'s inferred type satisfies `CreatePurchaseOrderInput` expected by `createPurchaseOrder`).

- [ ] **Step 7: Manually verify**

As `manager`: `curl -X POST .../api/purchase-orders -d '{"supplierId":"x","items":[]}'` → expect `400`. Valid body → expect `201`. `curl -X PATCH .../api/purchase-orders/<id>/status -d '{"status":"bogus"}'` → expect `400`.

- [ ] **Step 8: Commit**

```bash
git add schemas/purchase-order.ts schemas/purchase-order.test.ts app/api/purchase-orders/route.ts "app/api/purchase-orders/[id]/status/route.ts"
git commit -m "feat(validation): add Zod schemas for purchase-order create/status routes"
```

---

## Task 9: Zod-validate inventory routes (batches, transactions, waste-events)

**Files:**
- Create: `schemas/inventory.ts`
- Test: `schemas/inventory.test.ts`
- Modify: `app/api/inventory/batches/route.ts` (POST only)
- Modify: `app/api/inventory/transactions/route.ts` (POST only)
- Modify: `app/api/inventory/waste-events/route.ts` (POST only)

**Interfaces:**
- Produces: `createBatchSchema`, `createStockTransactionSchema`, `createWasteEventSchema` exported from `schemas/inventory.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// schemas/inventory.test.ts
import { describe, expect, test } from "bun:test"
import {
  createBatchSchema,
  createStockTransactionSchema,
  createWasteEventSchema,
} from "./inventory"

describe("createBatchSchema", () => {
  test("accepts a valid batch", () => {
    expect(
      createBatchSchema.safeParse({
        ingredientId: "64f0000000000000000000aa",
        batchNumber: "B-001",
        quantityRemaining: 10,
        unitCost: 2.5,
        expiryDate: "2026-12-31",
      }).success
    ).toBe(true)
  })

  test("rejects a negative quantityRemaining", () => {
    expect(
      createBatchSchema.safeParse({
        ingredientId: "x",
        batchNumber: "B-001",
        quantityRemaining: -1,
        unitCost: 2.5,
        expiryDate: "2026-12-31",
      }).success
    ).toBe(false)
  })
})

describe("createStockTransactionSchema", () => {
  test("accepts a valid transaction", () => {
    expect(
      createStockTransactionSchema.safeParse({
        ingredientId: "64f0000000000000000000aa",
        transactionType: "purchase",
        quantity: 5,
        unit: "kg",
      }).success
    ).toBe(true)
  })

  test("rejects an unknown transactionType", () => {
    expect(
      createStockTransactionSchema.safeParse({
        ingredientId: "x",
        transactionType: "bogus",
        quantity: 5,
        unit: "kg",
      }).success
    ).toBe(false)
  })
})

describe("createWasteEventSchema", () => {
  test("accepts a valid waste event", () => {
    expect(
      createWasteEventSchema.safeParse({
        ingredientId: "64f0000000000000000000aa",
        quantity: 2,
        unit: "kg",
        wasteReason: "spoiled",
        estimatedCost: 10,
      }).success
    ).toBe(true)
  })

  test("rejects an unknown wasteReason", () => {
    expect(
      createWasteEventSchema.safeParse({
        ingredientId: "x",
        quantity: 2,
        unit: "kg",
        wasteReason: "bogus",
        estimatedCost: 10,
      }).success
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test schemas/inventory.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the schema file**

```ts
// schemas/inventory.ts
import { z } from "zod"
import { StockTransactionTypeEnum, WasteReasonEnum, IngredientUnitEnum } from "@/features/inventory/types"

const ingredientUnitSchema = z.enum(IngredientUnitEnum)

export const createBatchSchema = z.object({
  ingredientId: z.string().min(1),
  batchNumber: z.string().min(1),
  quantityRemaining: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  expiryDate: z.string().min(1),
  receivedDate: z.string().optional(),
})

export const createStockTransactionSchema = z.object({
  ingredientId: z.string().min(1),
  batchId: z.string().optional(),
  transactionType: z.enum(StockTransactionTypeEnum),
  quantity: z.number().positive(),
  unit: ingredientUnitSchema,
  date: z.string().optional(),
  wasteReason: z.enum(WasteReasonEnum).optional(),
  estimatedCost: z.number().nonnegative().optional(),
})

export const createWasteEventSchema = z.object({
  ingredientId: z.string().min(1),
  batchId: z.string().optional(),
  quantity: z.number().positive(),
  unit: ingredientUnitSchema,
  wasteReason: z.enum(WasteReasonEnum),
  estimatedCost: z.number().nonnegative(),
  date: z.string().optional(),
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test schemas/inventory.test.ts`
Expected: PASS

- [ ] **Step 5: Wire schemas into the three routes**

`app/api/inventory/batches/route.ts` POST:

```ts
import { createBatchSchema } from "@/schemas/inventory"
import { readJsonBody } from "@/lib/api/route-helpers"
// ... add readJsonBody to the existing route-helpers import, add the schema import

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(INVENTORY_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, createBatchSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createBatch(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create inventory batch")
  }
}
```

`app/api/inventory/transactions/route.ts` POST:

```ts
import { connection } from "next/server"

import {
  createStockTransaction,
  getStockTransactions,
} from "@/features/inventory/api"
import type { StockTransactionTypeEnum } from "@/features/inventory/types"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { createStockTransactionSchema } from "@/schemas/inventory"

const INVENTORY_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  // unchanged — see existing file
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(INVENTORY_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, createStockTransactionSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createStockTransaction(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create stock transaction")
  }
}
```

`app/api/inventory/waste-events/route.ts` POST:

```ts
import { connection } from "next/server"

import { createWasteEvent, getWasteEvents } from "@/features/inventory/api"
import type { WasteReasonEnum } from "@/features/inventory/types"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { createWasteEventSchema } from "@/schemas/inventory"

const INVENTORY_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  // unchanged — see existing file
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(INVENTORY_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, createWasteEventSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createWasteEvent(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to log waste event")
  }
}
```

- [ ] **Step 6: Typecheck**

Run: `bun run typecheck` — expect no new errors (verify each schema's inferred type is assignable to the corresponding `CreateBatchInput`/`CreateStockTransactionInput`/`CreateWasteEventInput`).

- [ ] **Step 7: Manually verify**

As a role in `INVENTORY_ROLES`, POST an invalid body to each of the three routes (e.g. missing `ingredientId`) → expect `400` on all three. Valid bodies → expect `201`.

- [ ] **Step 8: Commit**

```bash
git add schemas/inventory.ts schemas/inventory.test.ts app/api/inventory/batches/route.ts app/api/inventory/transactions/route.ts app/api/inventory/waste-events/route.ts
git commit -m "feat(validation): add Zod schemas for inventory batch/transaction/waste-event routes"
```

---

## Task 10: Zod-validate suppliers, offers, and product-availability routes

**Files:**
- Create: `schemas/supplier.ts`, `schemas/offer.ts`
- Test: `schemas/supplier.test.ts`, `schemas/offer.test.ts`
- Modify: `app/api/suppliers/route.ts` (POST only)
- Modify: `app/api/offers/route.ts` (POST only)
- Modify: `app/api/offers/[id]/route.ts` (PATCH only)
- Modify: `app/api/products/[id]/availability/route.ts`

**Interfaces:**
- Produces: `createSupplierSchema` (`schemas/supplier.ts`), `createOfferSchema`/`updateOfferSchema` (`schemas/offer.ts`).

- [ ] **Step 1: Write the failing tests**

```ts
// schemas/supplier.test.ts
import { describe, expect, test } from "bun:test"
import { createSupplierSchema } from "./supplier"

describe("createSupplierSchema", () => {
  test("accepts a minimal valid supplier", () => {
    expect(createSupplierSchema.safeParse({ name: "Acme Foods" }).success).toBe(true)
  })

  test("rejects an empty name", () => {
    expect(createSupplierSchema.safeParse({ name: "" }).success).toBe(false)
  })

  test("rejects a negative leadTimeDays", () => {
    expect(createSupplierSchema.safeParse({ name: "Acme", leadTimeDays: -1 }).success).toBe(false)
  })
})
```

```ts
// schemas/offer.test.ts
import { describe, expect, test } from "bun:test"
import { createOfferSchema, updateOfferSchema } from "./offer"

describe("createOfferSchema", () => {
  test("accepts a valid offer", () => {
    expect(
      createOfferSchema.safeParse({
        productId: "64f0000000000000000000aa",
        startDate: "2026-08-08T00:00:00.000Z",
        endDate: "2026-08-15T00:00:00.000Z",
        availableQuantity: 10,
      }).success
    ).toBe(true)
  })

  test("rejects a negative availableQuantity", () => {
    expect(
      createOfferSchema.safeParse({
        productId: "x",
        startDate: "2026-08-08T00:00:00.000Z",
        endDate: "2026-08-15T00:00:00.000Z",
        availableQuantity: -1,
      }).success
    ).toBe(false)
  })
})

describe("updateOfferSchema", () => {
  test("accepts a partial update", () => {
    expect(updateOfferSchema.safeParse({ featured: true }).success).toBe(true)
  })

  test("rejects an unknown status", () => {
    expect(updateOfferSchema.safeParse({ status: "bogus" }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test schemas/supplier.test.ts schemas/offer.test.ts`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Create the schema files**

```ts
// schemas/supplier.ts
import { z } from "zod"

export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.email().optional(),
  phone: z.string().optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
})
```

```ts
// schemas/offer.ts
import { z } from "zod"

const offerStatusEnum = z.enum([
  "draft",
  "scheduled",
  "active",
  "expired",
  "cancelled",
  "sold_out",
])
const discountTypeEnum = z.enum(["percentage", "fixed"])

export const createOfferSchema = z.object({
  productId: z.string().min(1),
  discountType: discountTypeEnum.optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  offerPrice: z.number().nonnegative().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  availableQuantity: z.number().int().positive(),
  maxPerCustomer: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  status: offerStatusEnum.optional(),
})

export const updateOfferSchema = z.object({
  discountType: discountTypeEnum.optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  offerPrice: z.number().nonnegative().optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  availableQuantity: z.number().int().positive().optional(),
  maxPerCustomer: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  status: offerStatusEnum.optional(),
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test schemas/supplier.test.ts schemas/offer.test.ts`
Expected: PASS

- [ ] **Step 5: Wire schemas into the four routes**

`app/api/suppliers/route.ts` POST:

```ts
import { createSupplierSchema } from "@/schemas/supplier"
// add readJsonBody to the existing route-helpers import

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole([...MANAGER_ROLES])
  if (authError) return authError

  const parsed = await readJsonBody(request, createSupplierSchema)
  if (!parsed.ok) return parsed.response

  try {
    const data = await createSupplier(parsed.data)
    return jsonSuccess(data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create supplier")
  }
}
```

`app/api/offers/route.ts` POST:

```ts
import { createOfferSchema } from "@/schemas/offer"
// add readJsonBody to the existing route-helpers import

export async function POST(request: Request) {
  await connection()

  const authError = await requireAuth(OFFER_WRITE_ROLE)
  if (authError) return authError

  const parsed = await readJsonBody(request, createOfferSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createOffer(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create offer")
  }
}
```

`app/api/offers/[id]/route.ts` PATCH:

```ts
import { updateOfferSchema } from "@/schemas/offer"
// add readJsonBody to the existing route-helpers import

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAuth(OFFER_WRITE_ROLE)
  if (authError) return authError

  const { id } = await params

  const parsed = await readJsonBody(request, updateOfferSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await updateOffer(id, parsed.data)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update offer")
  }
}
```

`app/api/products/[id]/availability/route.ts` — inline schema is fine here (single boolean field, not reused elsewhere):

```ts
import { connection } from "next/server"
import { z } from "zod"

import { changeProductAvailability } from "@/features/products/api"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const PRODUCT_ROLES = ["admin", "manager", "staff"] as const
const availabilitySchema = z.object({ isAvailable: z.boolean() })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  const { id } = await params

  const parsed = await readJsonBody(request, availabilitySchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await changeProductAvailability(id, parsed.data.isAvailable)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update product availability")
  }
}
```

- [ ] **Step 6: Typecheck**

Run: `bun run typecheck` — expect no new errors.

- [ ] **Step 7: Manually verify**

POST invalid bodies (missing `name`/`productId`, wrong `status` enum value, non-boolean `isAvailable`) to each of the four routes → expect `400`. Valid bodies → expect success as before.

- [ ] **Step 8: Commit**

```bash
git add schemas/supplier.ts schemas/supplier.test.ts schemas/offer.ts schemas/offer.test.ts app/api/suppliers/route.ts app/api/offers/route.ts "app/api/offers/[id]/route.ts" "app/api/products/[id]/availability/route.ts"
git commit -m "feat(validation): add Zod schemas for supplier/offer/product-availability routes"
```

---

## Task 11: Validate file type/size on `POST /api/imports`

Currently only checks `formData.get("file") instanceof File` — no extension/MIME/size check before forwarding upstream.

**Files:**
- Modify: `app/api/imports/route.ts` (POST only)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new.

- [ ] **Step 1: Manually verify current (broken) behavior**

As `manager`, POST a multipart form with a `.exe` file (or any non-CSV) larger than a reasonable size as `file` → currently forwarded upstream without complaint from this BFF layer.

- [ ] **Step 2: Add the validation**

```ts
const ALLOWED_IMPORT_EXTENSIONS = [".csv"]
const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager", "admin"])
  if (!auth.ok) return auth.response

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return handleServerError(
      "Invalid request body",
      "Invalid request body",
      400
    )
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return handleServerError(
      "CSV file is required",
      "CSV file is required",
      400
    )
  }

  const hasAllowedExtension = ALLOWED_IMPORT_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  )
  if (!hasAllowedExtension) {
    return handleServerError(
      "Only .csv files are supported",
      "Only .csv files are supported",
      400
    )
  }

  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return handleServerError(
      "File exceeds the 10 MB import size limit",
      "File exceeds the 10 MB import size limit",
      400
    )
  }

  try {
    const data = await createImportJob(formData)
    return jsonSuccess(data, 201)
  } catch (err) {
    return handleUpstreamError(err, "Failed to create import job")
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck` — expect no new errors.

- [ ] **Step 4: Manually verify the fix**

Repeat Step 1 with a `.exe` file → expect `400` "Only .csv files are supported". Repeat with an oversized `.csv` (>10MB) → expect `400` size-limit message. Valid `.csv` under the limit → unchanged `201` behavior.

- [ ] **Step 5: Commit**

```bash
git add app/api/imports/route.ts
git commit -m "fix(validation): enforce .csv extension and 10MB size limit on import uploads"
```

---

## Task 12: Refactor partnership-applications admin routes onto `requireAdmin()` (fixes 401→403) and validate `submit`

Six routes duplicate the same inline `session.user.role !== "admin"` check returning `401` instead of `403` (per `route-helpers.ts` convention: 401 = not authenticated, 403 = authenticated but forbidden). `submit/route.ts` (public) casts the body with no schema.

**Files:**
- Create: `schemas/partnership.ts`
- Test: `schemas/partnership.test.ts`
- Modify: `app/api/partnership-applications/route.ts`
- Modify: `app/api/partnership-applications/[id]/route.ts`
- Modify: `app/api/partnership-applications/[id]/approve/route.ts`
- Modify: `app/api/partnership-applications/[id]/reject/route.ts`
- Modify: `app/api/partnership-applications/[id]/review/route.ts`
- Modify: `app/api/partnership-applications/[id]/resend-approval-email/route.ts`
- Modify: `app/api/partnership-applications/submit/route.ts`

**Interfaces:**
- Produces: `createPartnershipSchema` from `schemas/partnership.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// schemas/partnership.test.ts
import { describe, expect, test } from "bun:test"
import { createPartnershipSchema } from "./partnership"

describe("createPartnershipSchema", () => {
  test("accepts a minimal valid application", () => {
    expect(
      createPartnershipSchema.safeParse({
        businessName: "Joe's Diner",
        businessType: "restaurant",
        ownerFirstName: "Joe",
        ownerLastName: "Smith",
        email: "joe@example.com",
        phone: "+201012345678",
        city: "Cairo",
      }).success
    ).toBe(true)
  })

  test("rejects a missing businessName", () => {
    expect(
      createPartnershipSchema.safeParse({
        businessType: "restaurant",
        ownerFirstName: "Joe",
        ownerLastName: "Smith",
        email: "joe@example.com",
        phone: "+201012345678",
        city: "Cairo",
      }).success
    ).toBe(false)
  })

  test("rejects an invalid email", () => {
    expect(
      createPartnershipSchema.safeParse({
        businessName: "Joe's Diner",
        businessType: "restaurant",
        ownerFirstName: "Joe",
        ownerLastName: "Smith",
        email: "not-an-email",
        phone: "+201012345678",
        city: "Cairo",
      }).success
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test schemas/partnership.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the schema**

```ts
// schemas/partnership.ts
import { z } from "zod"

export const createPartnershipSchema = z.object({
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  description: z.string().optional(),
  estimatedOrdersPerDay: z.number().nonnegative().optional(),
  estimatedWasteKgPerDay: z.number().nonnegative().optional(),
  ownerFirstName: z.string().min(1),
  ownerLastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  district: z.string().optional(),
  street: z.string().optional(),
  website: z.string().optional(),
  facebookPage: z.string().optional(),
  instagramPage: z.string().optional(),
  commercialRegistration: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test schemas/partnership.test.ts`
Expected: PASS

- [ ] **Step 5: Refactor the six admin routes onto `requireAdmin()`**

For each of `route.ts`, `[id]/route.ts`, `[id]/approve/route.ts`, `[id]/reject/route.ts`, `[id]/review/route.ts`, `[id]/resend-approval-email/route.ts`: replace the inline block

```ts
  const session = await getSession()
  if (!session.isLoggedIn || !session.user || session.user.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Admin access required" },
      { status: 401 }
    )
  }
```

with

```ts
  const authError = await requireAdmin()
  if (authError) return authError
```

removing the now-unused `getSession` import from each file and adding `import { requireAdmin } from "@/lib/api/route-helpers"`. Example for `app/api/partnership-applications/[id]/reject/route.ts`:

```ts
import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  rejectPartnershipApplication,
  type PartnershipApplicationItem,
} from "@/features/partner/api"
import { requireAdmin } from "@/lib/api/route-helpers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  let body: { reason?: string }
  try {
    body = (await request.json()) as { reason?: string }
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  if (!body.reason || !body.reason.trim()) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Rejection reason is required" },
      { status: 400 }
    )
  }

  try {
    const data = await rejectPartnershipApplication(id, body.reason)
    return NextResponse.json<ApiResponse<PartnershipApplicationItem>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/partnership-applications/[id]/reject] POST failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "ACTION_FAILED",
        message: err instanceof Error ? err.message : "Failed to reject application",
      },
      { status: 400 }
    )
  }
}
```

Apply the same `requireAdmin()` swap to the other five files, keeping each file's existing body-handling logic (reject's reason check, approve/review/resend's no-body calls, the list/detail GET handlers' query/param logic) unchanged — only the auth block and its imports change.

- [ ] **Step 6: Validate the `submit` route body**

```ts
// app/api/partnership-applications/submit/route.ts
import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  submitPartnershipApplication,
  type PartnershipApplicationItem,
} from "@/features/partner/api"
import { readJsonBody } from "@/lib/api/route-helpers"
import { createPartnershipSchema } from "@/schemas/partnership"

export async function POST(request: Request) {
  await connection()

  const parsed = await readJsonBody(request, createPartnershipSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await submitPartnershipApplication(parsed.data)
    return NextResponse.json<
      ApiResponse<{ message: string; application: PartnershipApplicationItem }>
    >({ success: true, data: res }, { status: 201 })
  } catch (err) {
    console.error("[api/partnership-applications/submit] POST failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "SUBMIT_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "Failed to submit partnership application",
      },
      { status: 400 }
    )
  }
}
```

- [ ] **Step 7: Typecheck**

Run: `bun run typecheck` — expect no new errors.

- [ ] **Step 8: Manually verify**

As `manager` (or any non-admin authenticated user), call each of the six admin routes → expect `403` (was `401`). Unauthenticated → still `401` (via `requireAdmin()` → `requireAuth()` path). As `admin`, confirm all six still work as before. POST an invalid body (missing `businessName`) to `submit` → expect `400` with field-level Zod message.

- [ ] **Step 9: Commit**

```bash
git add schemas/partnership.ts schemas/partnership.test.ts app/api/partnership-applications
git commit -m "fix(auth): use requireAdmin() for correct 403 on partnership-application admin routes, validate submit body"
```

---

## Task 13: Add security headers via `next.config.ts`

No security headers exist today (no CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame protection). Use Next.js's native `headers()` config — no new dependency.

**Files:**
- Modify: `next.config.ts`

**Interfaces:** none.

- [ ] **Step 1: Manually verify current (broken) behavior**

Run: `curl -sI http://localhost:3000/en` (dev server running)
Expected (current): no `content-security-policy`, `x-content-type-options`, `referrer-policy`, `permissions-policy`, or `x-frame-options` headers present.

- [ ] **Step 2: Add the `headers()` function**

```ts
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const isProd = process.env.NODE_ENV === "production"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  cacheComponents: true,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "connect-src 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
      ...(isProd
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : []),
    ]

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
```

Note: `script-src` includes `'unsafe-inline' 'unsafe-eval'` because Next.js's dev-mode HMR and some React runtime behavior require it — start here and tighten to a nonce-based policy only if the team wants to invest in that later; a broken CSP that blocks the app's own scripts is worse than a permissive one. `connect-src 'self'` covers same-origin `/api/*` calls; if the app calls `API_URL` directly from the browser anywhere (it shouldn't per the BFF pattern, but verify in Step 4), that origin needs adding here.

- [ ] **Step 3: Typecheck and build**

Run: `bun run typecheck` — expect no new errors.
Run: `bun run build` — expect a successful production build (this exercises `next.config.ts` parsing).

- [ ] **Step 4: Manually verify the fix**

Run: `bun dev`, then `curl -sI http://localhost:3000/en`. Expected: `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: ...`, `content-security-policy: ...` all present. Then click through the app's main flows in a browser (login, dashboard navigation, an image-heavy page like products) with devtools console open — confirm no CSP violation errors. If any appear for a legitimate resource, add that source to the relevant directive rather than loosening `default-src`.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts
git commit -m "feat(security): add CSP, HSTS, and other security headers via next.config.ts"
```

---

## Task 14: Rewrite `useNotifications` onto react-query (dedupe list/count fetches across dropdown + manager page)

`features/notifications/hooks/useNotifications.ts` hand-rolls `useState`/`useEffect` fetching with no cache. Both `NotificationDropdown` (mounted on every dashboard page) and `NotificationsManager` (the `/dashboard/notifications` page) call `useNotifications()` independently, each firing its own list + unread-count requests, and every `fetchNotifications()` call unconditionally also re-fetches the count. Re-implement on `@tanstack/react-query` (the pattern every other feature in this codebase already uses) while preserving the exact public return shape, so `NotificationDropdown` and `NotificationsManager` need no changes.

**Files:**
- Modify: `features/notifications/hooks/useNotifications.ts`
- Test: manual (see Step 1/4) — this hook has UI/socket side effects not practical to unit test with `bun:test` alone, consistent with how the rest of this codebase's hooks are verified (no existing `*.hooks.test.ts` pattern to follow).

**Interfaces:**
- Consumes: `notificationService` (`features/notifications/services/notification-service.ts`, unchanged), `notificationSocketService` (`features/notifications/services/socket-service.ts`, unchanged), types from `features/notifications/types`.
- Produces: `useNotifications(options?): { notifications, unreadCount, pagination, isLoading, isRefreshing, error, query, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, deleteNotification, refresh }` — **same shape as today**, consumed unchanged by `features/notifications/components/notifications-manager.tsx` and `components/shadcn-space/blocks/dashboard-shell-01/notification-dropdown.tsx`.

- [ ] **Step 1: Manually verify current (broken) behavior**

With the dev server running and React Query Devtools (or the Network tab) open, log in as `manager` and open a dashboard page that shows the notification bell, then navigate to `/en/dashboard/notifications`. Confirm two independent sets of `GET /api/notifications` + `GET /api/notifications/unread-count` calls fire (one from the dropdown's mount, one from the manager page's mount), and that filtering/paginating on the manager page fires a `GET /api/notifications/unread-count` on every filter/page change even though the count didn't need to change.

- [ ] **Step 2: Rewrite the hook**

```ts
// features/notifications/hooks/useNotifications.ts
"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "../services/notification-service"
import { notificationSocketService } from "../services/socket-service"
import type {
  NotificationItem,
  NotificationQuery,
  PaginatedNotifications,
  PaginationMeta,
  UnreadCountData,
} from "../types"

interface UseNotificationsOptions {
  initialQuery?: NotificationQuery
  autoFetchOnMount?: boolean
}

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
}

const listKey = (query: NotificationQuery) => ["notifications", "list", query] as const
const unreadCountKey = ["notifications", "unread-count"] as const

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { initialQuery = { page: 1, limit: 10 }, autoFetchOnMount = true } = options
  const queryClient = useQueryClient()

  // `initialQuery` is only read on mount by design — callers change the
  // query via `fetchNotifications(overrideQuery)`, which react-query keys
  // off of directly, matching the previous hook's external contract.
  const activeQuery = initialQuery

  const listQuery = useQuery({
    queryKey: listKey(activeQuery),
    queryFn: () => notificationService.getUserNotifications(activeQuery),
    enabled: autoFetchOnMount,
  })

  const unreadCountQuery = useQuery({
    queryKey: unreadCountKey,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000,
  })

  const notifications = listQuery.data?.data ?? []
  const pagination = listQuery.data?.pagination ?? EMPTY_PAGINATION
  const unreadCount = unreadCountQuery.data?.count ?? 0

  const fetchUnreadCount = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: unreadCountKey })
  }, [queryClient])

  const fetchNotifications = useCallback(
    async (overrideQuery?: NotificationQuery) => {
      const nextQuery = { ...activeQuery, ...overrideQuery }
      await queryClient.fetchQuery({
        queryKey: listKey(nextQuery),
        queryFn: () => notificationService.getUserNotifications(nextQuery),
      })
      // Every list refetch previously also refreshed the count; keep that
      // behavior (filters/pagination don't change the count, but marking
      // read/deleting elsewhere might have — cheap, deduped by staleTime).
      await fetchUnreadCount()
    },
    [activeQuery, queryClient, fetchUnreadCount]
  )

  const markAsRead = useCallback(
    async (id: string) => {
      queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) =>
        old
          ? {
              ...old,
              data: old.data.map((item) =>
                item.id === id
                  ? { ...item, isRead: true, readAt: new Date().toISOString() }
                  : item
              ),
            }
          : old
      )
      queryClient.setQueryData<UnreadCountData>(unreadCountKey, (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old
      )
      try {
        await notificationService.markAsRead(id)
      } catch (err) {
        console.error(`[useNotifications] markAsRead failed for ${id}`, err)
        await fetchUnreadCount()
      }
    },
    [queryClient, activeQuery, fetchUnreadCount]
  )

  const markAllAsRead = useCallback(async () => {
    queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) =>
      old
        ? { ...old, data: old.data.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })) }
        : old
    )
    queryClient.setQueryData<UnreadCountData>(unreadCountKey, { count: 0 })
    try {
      await notificationService.markAllAsRead()
    } catch (err) {
      console.error("[useNotifications] markAllAsRead failed", err)
      await fetchUnreadCount()
    }
  }, [queryClient, activeQuery, fetchUnreadCount])

  const deleteNotification = useCallback(
    async (id: string) => {
      const current = queryClient.getQueryData<PaginatedNotifications>(listKey(activeQuery))
      const target = current?.data.find((item) => item.id === id)

      queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) =>
        old ? { ...old, data: old.data.filter((item) => item.id !== id) } : old
      )
      if (target && !target.isRead) {
        queryClient.setQueryData<UnreadCountData>(unreadCountKey, (old) =>
          old ? { count: Math.max(0, old.count - 1) } : old
        )
      }

      try {
        await notificationService.deleteNotification(id)
      } catch (err) {
        console.error(`[useNotifications] deleteNotification failed for ${id}`, err)
        await fetchNotifications()
      }
    },
    [queryClient, activeQuery, fetchNotifications]
  )

  // Subscribe to live WebSocket notifications — updates the shared cache
  // directly so every mounted consumer (dropdown + manager page) sees the
  // same update without each running its own subscription-driven refetch.
  useEffect(() => {
    const unsubscribe = notificationSocketService.subscribe((incoming) => {
      queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) => {
        if (!old) return old
        if (old.data.some((item) => item.id === incoming.id)) return old
        if (activeQuery.type && incoming.type !== activeQuery.type) return old
        if (activeQuery.isRead === true) return old
        return {
          ...old,
          data: [incoming, ...old.data],
          pagination: { ...old.pagination, totalItems: old.pagination.totalItems + 1 },
        }
      })
      queryClient.setQueryData<UnreadCountData>(unreadCountKey, (old) => ({
        count: (old?.count ?? 0) + 1,
      }))
    })

    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, activeQuery.type, activeQuery.isRead])

  return {
    notifications,
    unreadCount,
    pagination,
    isLoading: listQuery.isLoading,
    isRefreshing: listQuery.isFetching && !listQuery.isLoading,
    error: listQuery.error instanceof Error ? listQuery.error.message : null,
    query: activeQuery,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: listKey(activeQuery) }).then(fetchUnreadCount),
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck` — expect no new errors. Pay particular attention to `notifications-manager.tsx` and `notification-dropdown.tsx`: both destructure `fetchNotifications`, `markAsRead`, `markAllAsRead`, `deleteNotification`, `refresh` from the hook and call them the same way as before — no changes needed there, but the typecheck will catch it if a type narrowed unexpectedly.

- [ ] **Step 4: Manually verify the fix**

Repeat Step 1: open a dashboard page (dropdown mounts) then navigate to `/en/dashboard/notifications` (manager mounts). Confirm via Network tab that the second mount reuses the cached list/count (no immediate duplicate fetch within the 30s unread-count staleTime / until the manager page's own `initialQuery` differs from the dropdown's, in which case a new list query is expected — that's correct, they show different pages/filters by design). Mark a notification as read from the dropdown and confirm the manager page's list (if open in another tab/already rendered) reflects it after its next natural refetch. Change a filter on the manager page and confirm exactly one `GET /api/notifications` fires per filter change (no longer paired with a mandatory unread-count call when the count is still fresh within its 30s `staleTime`— a slight, intentional reduction from the previous 1:1 pairing, per the "produces" note above only firing the count check when needed).

- [ ] **Step 5: Commit**

```bash
git add features/notifications/hooks/useNotifications.ts
git commit -m "refactor(notifications): rewrite useNotifications on react-query to share cache across dropdown and manager page"
```

---

## Explicitly descoped (investigated, not fixed)

Two items from the design doc's Phase 3 were investigated during planning and found not to warrant a code change:

- **Assistant chat's blanket `invalidateQueries()`** (`features/assistant/hooks/use-assistant-chat.ts:89`): the code comment already documents why — an approved assistant action can create offers, purchase orders, or production plans, and enumerating exact query keys per tool would require a tool→key mapping for a rare, user-initiated event (only fires when a human explicitly approves an assistant suggestion, not on every render or poll). Left as-is.
- **Header components fetching `/profile` separately from `/api/auth/me`** (`components/common/Navbar.tsx`, `site-header.tsx`, `user-dropdown.tsx` via `useProfile()`): `useProfile()` already uses a shared react-query key (`["user","profile"]`, `staleTime: 60s`), so this is not a per-component duplicate — react-query dedupes it across all three call sites. It is one additional request per session beyond `/api/auth/me`, but it carries data (avatar image URL) that the session object doesn't. Not a bug; left as-is.

## Final verification (after all tasks)

- [ ] Run `bun run typecheck` — zero errors.
- [ ] Run `bun run lint` — zero new warnings/errors introduced by this plan's changes.
- [ ] Run `bun test` — all `bun:test` files pass (`lib/phone.test.ts`, `lib/utils.test.ts`, and the new `schemas/*.test.ts` + `lib/auth/config.test.ts`).
- [ ] Run `bun run build` — production build succeeds.
- [ ] Manual smoke test as each role (`customer`, `staff`, `manager`, `admin`): log in, hit the dashboard, confirm no previously-working page/action now incorrectly 403s for its legitimate role.
