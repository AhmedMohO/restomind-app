# Implementation Plan — Dashboard Restaurant & Manager Profile Module (Final)

## Goal
Build a production-ready, fully localized **Restaurant Profile & Manager Account Settings** page in `/dashboard/profile`. All dashboard pages are **Client Components** using **TanStack Query + Axios (BFF)**. Dashboard translations live in **separate JSON files** linked into `next-intl`.

---

## Key Architecture Decisions (from user feedback + Next.js docs)

> [!IMPORTANT]
> **1. `"use client"` boundary — Dashboard Layout only**  
> Per the [Next.js `use client` docs](node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md): _"You only need to add it to files whose components you want to render directly within Server Components. The directive defines the client-server boundary."_  
> Adding `"use client"` to `app/[locale]/dashboard/layout.tsx` makes the entire dashboard subtree a client boundary. **Page files and container components do NOT need their own `"use client"` directive** — they inherit the client context automatically.
>
> **2. Hooks never need `"use client"`**  
> React hooks (`useQuery`, `useState`, custom hooks) are inherently client-only. Writing `"use client"` in a hook file is incorrect — that directive only belongs on **component** entry-point files, not utility/hook modules.
>
> **3. Separate i18n JSON files**: Dashboard translations live in `messages/dashboard/en.json` and `messages/dashboard/ar.json`. These are merged into the global `next-intl` message tree inside `i18n/request.ts` under the `"Dashboard"` namespace.
>
> **4. Admin = Manager**: Admins can do everything managers can. Both roles reach the restaurant profile via the same BFF route handler, which selects the correct backend endpoint based on the user's role from the Iron Session.
>
> **5. `logoUrl` = string field**: Per the Restaurant schema in `API_DOCUMENTATION.md`, `logoUrl` is a plain `string` (URL). No file upload — just a URL text input validated as a valid URL.
>
> **6. AGENTS.md**: `node_modules/next/dist/docs/` has been consulted before writing this plan. All patterns follow the current Next.js App Router conventions and heed deprecation notices.

---

## Proposed Changes

---

### 1. New Dashboard Translation Files (`next-intl`)

#### [NEW] [messages/dashboard/en.json](file:///f:/Work/ITI%20Project/restomind/restomind-app/messages/dashboard/en.json)
```json
{
  "nav": {
    "analytics":          "Analytics",
    "restaurantProfile":  "Restaurant Profile",
    "accountSettings":    "Account Settings",
    "signOut":            "Sign Out"
  },
  "restaurant": {
    "pageTitle":          "Restaurant Profile",
    "pageSubtitle":       "Manage your restaurant's public information, contact details, and online status",
    "sectionBasic":       "Basic Information",
    "sectionBasicDesc":   "Update your restaurant name, description and contact number",
    "sectionLogo":        "Logo",
    "sectionLogoDesc":    "Paste a public URL for your restaurant's logo image",
    "sectionAddress":     "Location & Address",
    "sectionAddressDesc": "Where customers can find or collect from your restaurant",
    "sectionStatus":      "Online Status",
    "sectionStatusDesc":  "Control whether your restaurant appears as open or closed to customers",
    "nameLabel":          "Restaurant Name",
    "namePlaceholder":    "e.g. The Golden Fork",
    "descLabel":          "Description",
    "descPlaceholder":    "Briefly describe your restaurant, cuisine, and specialties",
    "descCounter":        "{count}/500",
    "phoneLabel":         "Contact Phone",
    "phonePlaceholder":   "+20 10 0000 0000",
    "logoUrlLabel":       "Logo URL",
    "logoUrlPlaceholder": "https://example.com/logo.png",
    "streetLabel":        "Street Address",
    "streetPlaceholder":  "Building no., Street name",
    "cityLabel":          "City",
    "cityPlaceholder":    "e.g. Cairo, Giza, Alexandria",
    "countryLabel":       "Country",
    "countryPlaceholder": "Egypt",
    "isActiveLabel":      "Restaurant is Online",
    "isActiveDesc":       "When enabled, customers can view and order from your restaurant",
    "statusOnline":       "Online",
    "statusOffline":      "Offline",
    "saveChanges":        "Save Changes",
    "saving":             "Saving…",
    "saveSuccess":        "Restaurant profile updated successfully!",
    "saveError":          "Failed to update restaurant profile. Please try again.",
    "fetchError":         "Could not load restaurant data",
    "noRestaurantTitle":  "No Restaurant Assigned",
    "noRestaurantDesc":   "Your account is not linked to any restaurant. Please contact an administrator to set this up.",
    "noRestaurantCta":    "Contact Admin",
    "dirtyWarning":       "You have unsaved changes — remember to save before leaving this page."
  },
  "account": {
    "pageTitle":          "Account Settings",
    "pageSubtitle":       "Update your personal details and login information",
    "avatarChange":       "Change Photo",
    "avatarUploading":    "Uploading…",
    "avatarSuccess":      "Profile photo updated!",
    "avatarError":        "Failed to upload photo. Please try again.",
    "tabRestaurant":      "Restaurant",
    "tabAccount":         "My Account"
  }
}
```

#### [NEW] [messages/dashboard/ar.json](file:///f:/Work/ITI%20Project/restomind/restomind-app/messages/dashboard/ar.json)
Full Arabic translation of all keys above (RTL-correct phrasing).

---

### 2. Link Dashboard JSON into `next-intl`

#### [MODIFY] [i18n/request.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/i18n/request.ts)

Merge the new dashboard file under the `"Dashboard"` namespace:

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { setZodLocale } from '@/lib/zod-locale';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as 'en' | 'ar')) {
    locale = routing.defaultLocale;
  }

  setZodLocale(locale);

  const [baseMessages, dashboardMessages] = await Promise.all([
    import(`../messages/${locale}.json`),
    import(`../messages/dashboard/${locale}.json`),
  ]);

  return {
    locale,
    messages: {
      ...baseMessages.default,
      Dashboard: dashboardMessages.default,   // ← scoped under "Dashboard"
    },
  };
});
```

This means in components: `useTranslations("Dashboard.restaurant")`, `useTranslations("Dashboard.nav")`, etc.

---

### 3. Zod Restaurant Schema

#### [NEW] [schemas/restaurant.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/schemas/restaurant.ts)

```typescript
import { z } from "zod"
import { optionalEgyptianPhoneSchema } from "@/lib/phone"

export const restaurantSchema = z.object({
  name:        z.string().min(3, { message: "restaurantNameMin" }).max(60, { message: "restaurantNameMax" }),
  description: z.string().max(500, { message: "restaurantDescMax" }).optional().nullable(),
  phone:       optionalEgyptianPhoneSchema,
  logoUrl:     z.string().url({ message: "invalidLogoUrl" }).optional().nullable()
                 .or(z.literal("")),   // allow clearing the field
  address: z.object({
    street:  z.string().min(3, { message: "errorMinStreet" }).optional().or(z.literal("")).nullable(),
    city:    z.string().min(2, { message: "errorMinCity" }).optional().or(z.literal("")).nullable(),
    country: z.string().optional().nullable(),
  }).optional(),
  isActive: z.boolean(),
})

export type RestaurantInput = z.infer<typeof restaurantSchema>
```

#### [MODIFY] [messages/en.json](file:///f:/Work/ITI%20Project/restomind/restomind-app/messages/en.json) & [ar.json](file:///f:/Work/ITI%20Project/restomind/restomind-app/messages/ar.json)

Add new keys to existing `"Validation"` object:
- `"restaurantNameMin"`: `"Restaurant name must be at least 3 characters"`
- `"restaurantNameMax"`: `"Restaurant name must be at most 60 characters"`
- `"restaurantDescMax"`: `"Description cannot exceed 500 characters"`
- `"invalidLogoUrl"`:   `"Logo URL must be a valid web address"`

---

### 4. Client Axios Instance

#### [NEW] [lib/api/axios-client.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/lib/api/axios-client.ts)

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

export const clientApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

// Single-flight 401 refresh queue
let isRefreshing = false
let failedQueue: { resolve: () => void; reject: (err: unknown) => void }[] = []

const processQueue = (err: unknown = null) =>
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve()))

clientApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const req = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !req._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          failedQueue.push({ resolve, reject })
        ).then(() => clientApi(req))

      }
      req._retry = true
      isRefreshing = true
      try {
        await clientApi.post("/auth/refresh")
        processQueue(null)
        return clientApi(req)
      } catch (refreshErr) {
        processQueue(refreshErr)
        if (typeof window !== "undefined") window.location.href = "/login"
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
```

---

### 5. Domain Types & Server-Side API

#### [NEW] [features/restaurant/types.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/types.ts)
```typescript
export interface RestaurantAddress { street?: string; city?: string; country?: string }

export interface Restaurant {
  _id:          string
  name:         string
  ownerUserId:  string
  description?: string
  logoUrl?:     string     // plain URL string per API schema
  phone?:       string
  address?:     RestaurantAddress
  isActive:     boolean
  isDeleted:    boolean
  createdAt:    string
  updatedAt:    string
}

export interface UpdateRestaurantPayload {
  name?:        string
  description?: string | null
  phone?:       string | null
  logoUrl?:     string | null
  address?:     RestaurantAddress
  isActive?:    boolean
}
```

#### [NEW] [features/restaurant/api/index.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/api/index.ts)
`"server-only"` wrappers using `apiClient()`:
- `getMyRestaurantApi()` → `GET /restaurants/me`
- `getRestaurantByIdApi(id)` → `GET /restaurants/:id` (admin path)
- `updateRestaurantApi(id, payload)` → `PATCH /restaurants/:id`

---

### 6. BFF Route Handlers

#### [NEW] [app/api/restaurant/me/route.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/app/api/restaurant/me/route.ts)

**GET**: Role-aware endpoint — reads the Iron Session to determine whether to call `/restaurants/me` (manager) or `/restaurants/:restaurantId` (admin with restaurantId). Returns 404 JSON if no restaurant found.

**PATCH**: Reads restaurant ID from the session/GET result, calls `updateRestaurantApi(id, body)`. Validates that the body is not empty.

```typescript
// GET handler logic:
const session = await getSession()
const role    = session.user?.role
const userId  = session.user?._id

let restaurant: Restaurant

if (role === "manager") {
  restaurant = await getMyRestaurantApi()              // GET /restaurants/me
} else if (role === "admin") {
  // Admins may also have a restaurantId if they manage one
  if (session.user?.restaurantId) {
    restaurant = await getRestaurantByIdApi(session.user.restaurantId)
  } else {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 })
  }
}
```

> [!NOTE]
> For this to work, `restaurantId` needs to be stored in the `SessionUser` type and populated during login. This requires a small addition to `features/auth/auth.ts` and the login Server Action.

#### [MODIFY] [features/auth/auth.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/auth/auth.ts)

Add `restaurantId?: string` to `SessionUser` interface so it is available in the Iron Session.

---

### 7. TanStack Query Hooks

#### [NEW] [features/restaurant/hooks/use-restaurant.ts](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/hooks/use-restaurant.ts)

> [!NOTE]
> **No `"use client"` directive here.** Hook files are not component entry-points. They only work inside components that are already in a client boundary (which is established by the dashboard `layout.tsx`).

```typescript
// ← No "use client" directive — hooks are inherently client-only utilities
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@/lib/api/axios-client"
import type { Restaurant, UpdateRestaurantPayload } from "../types"

export const RESTAURANT_QUERY_KEY = ["restaurant", "me"] as const

export function useMyRestaurant() {
  return useQuery<Restaurant | null>({
    queryKey: RESTAURANT_QUERY_KEY,
    queryFn: async () => {
      const { data } = await clientApi.get("/restaurant/me")
      return data.data ?? null
    },
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
  })
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateRestaurantPayload) => {
      const { data } = await clientApi.patch("/restaurant/me", payload)
      return data.data as Restaurant
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(RESTAURANT_QUERY_KEY, updated)  // optimistic cache update
    },
  })
}
```

---

### 8. UI Components

#### [NEW] [features/restaurant/components/restaurant-profile-skeleton.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/components/restaurant-profile-skeleton.tsx)
Skeleton matching the exact form card layout — shown while `useMyRestaurant()` is loading.

#### [NEW] [features/restaurant/components/no-restaurant-card.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/components/no-restaurant-card.tsx)
Centered `<Card>` with `AlertTriangle` icon (amber), translated title/description, and a "Contact Admin" outline button.

#### [NEW] [features/restaurant/components/restaurant-status-badge.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/components/restaurant-status-badge.tsx)
Compact `<Badge>` — `bg-emerald-500/10 text-emerald-700` (Online) or `bg-muted text-muted-foreground` (Offline).

#### [NEW] [features/restaurant/components/restaurant-profile-form.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/components/restaurant-profile-form.tsx)

Client component. Full implementation:

- `"use client"` directive.
- `useZodResolver(restaurantSchema)` — locale-aware Zod validation.
- `useTranslations("Dashboard.restaurant")` for all strings.
- React Hook Form `register`, `handleSubmit`, `formState`, `watch`, `reset`.
- `useUpdateRestaurant()` mutation from TanStack Query.
- **Layout**: Three `<Card>` sections stacked vertically:
  1. **Basic Info**: Name (required), Description (textarea with `watch`-driven character counter `{n}/500`), Phone.
  2. **Logo & Address**: Logo URL (text input with inline `<img>` preview if URL is valid), Street, City, Country.
  3. **Status**: `<Switch>` for `isActive` with inline `<RestaurantStatusBadge>`.
- **Dirty warning**: `<Alert variant="warning">` above form when `isDirty === true`.
- **Submit row**: Right-aligned `<Button>` disabled when `!isDirty || isPending`. Shows `<Loader2>` spinner with "Saving…" text during mutation.
- **Toast**: `sonner` toast on `onSuccess` (green) and `onError` (red).
- **Reset on success**: `reset(updatedData)` called after successful mutation to clear `isDirty`.

#### [NEW] [features/restaurant/components/restaurant-container.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/features/restaurant/components/restaurant-container.tsx)

> [!NOTE]
> `"use client"` is placed **here** on the outermost feature component — making this the client boundary entry point when it is imported by a server page. However since the **dashboard layout itself** will carry `"use client"`, this directive is redundant here. It is shown for clarity only.

```typescript
// "use client" is inherited from the dashboard layout boundary
// No need to repeat it on this component
function RestaurantContainer() {
  const { data, isLoading, isError, error } = useMyRestaurant()

  if (isLoading) return <RestaurantProfileSkeleton />
  
  // 404 = manager account not linked to a restaurant
  if (!data || (error as any)?.response?.status === 404) return <NoRestaurantCard />
  
  if (isError) return <ErrorCard message={t("Dashboard.restaurant.fetchError")} />
  
  return <RestaurantProfileForm initialData={data} />
}
```

---

### 9. Dashboard Profile Page

#### [MODIFY] [app/[locale]/dashboard/layout.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/app/%5Blocale%5D/dashboard/layout.tsx)

Add `"use client"` to the dashboard layout — this is the **single client boundary** for the entire `/dashboard` subtree. Per Next.js docs, this makes all page components, container components, and hooks in this subtree automatically client-side without needing `"use client"` in each one.

```typescript
"use client"
// ↑ Single client boundary for all /dashboard pages.
// Pages, containers, and hooks below do NOT repeat this directive.

import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
// Note: ProtectedRoute currently is a Server Component.
// Since we're making the layout a Client Component, ProtectedRoute's
// server-only logic (cookies, redirect) must move into a server wrapper
// or middleware. The proxy.ts (middleware) already handles auth redirects.
// We will rely on proxy.ts for protection and remove ProtectedRoute from this layout.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

> [!WARNING]
> **ProtectedRoute Conflict**: `ProtectedRoute` is a Server Component that calls `cookies()` and `redirect()` — these cannot be used in a Client Component layout. Since `proxy.ts` (middleware) already guards all `/dashboard` routes by checking the Iron Session cookie and redirecting unauthenticated users, `ProtectedRoute` in the layout becomes **redundant** when the layout is a Client Component. It will be removed from the dashboard layout.

#### [NEW] [app/[locale]/dashboard/profile/page.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/app/%5Blocale%5D/dashboard/profile/page.tsx)

```typescript
// No "use client" needed here — inherited from dashboard/layout.tsx boundary.
// Uses useState, TanStack Query hooks freely.

// Tabs: Restaurant | My Account
// Restaurant tab → <RestaurantContainer />
// My Account tab → <ProfileContainer /> hydrated via useQuery → /api/auth/me
```

The page uses two tabs rendered inside the existing `<AppSidebar>` shell. Tab state is controlled by `useState`. All data fetching is client-side via TanStack Query hooks — no server-side data fetching on the page.

---

### 10. Sidebar & Header Wiring

#### [MODIFY] [app-sidebar.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar.tsx)

Update `navData` with real localized routes using `useTranslations("Dashboard.nav")`:
- Analytics → `/dashboard`
- Restaurant Profile → `/dashboard/profile` (tab: `restaurant`)
- Account Settings → `/dashboard/profile` (tab: `account`)

Active state: compare `usePathname()` (already implemented in `nav-main.tsx`).

#### [MODIFY] [user-dropdown.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/components/shadcn-space/blocks/dashboard-shell-01/user-dropdown.tsx)

Replace hard-coded dummy data:
- Wire to `useAuthStore()` for real `firstName`, `lastName`, email.
- Avatar: `session.user.image?.secure_url` or initials fallback `"FM"` from first+last name.
- "Account Settings" link → `/dashboard/profile`.
- "Sign Out" → call `POST /api/auth/logout` action and redirect.

#### [MODIFY] [site-header.tsx](file:///f:/Work/ITI%20Project/restomind/restomind-app/components/shadcn-space/blocks/dashboard-shell-01/site-header.tsx)

Replace hard-coded avatar src with real user avatar from `useAuthStore()`.

---

## Complete Edge Case Coverage

| # | Edge Case | Handling |
|---|-----------|----------|
| 1 | Manager with no `restaurantId` → API 404 | `<NoRestaurantCard />` with translated empty-state |
| 2 | Admin with no `restaurantId` | Same `<NoRestaurantCard />` path (404 from BFF handler) |
| 3 | Network error on load | `<ErrorCard />` with retry button; `isError` state from `useQuery` |
| 4 | Zod validation: EN | Error messages from `Validation` keys in `messages/en.json` via `useZodResolver` |
| 5 | Zod validation: AR | Same flow, Arabic keys in `messages/ar.json` |
| 6 | Empty `logoUrl` string | Accepted (optional field, `z.literal("")` allows clearing) |
| 7 | Invalid logo URL format | Zod `.url()` with `"invalidLogoUrl"` message key |
| 8 | Submit with no changes | `isDirty` guard disables button |
| 9 | Dirty form + no save | Amber warning banner `"You have unsaved changes"` |
| 10 | Double-click submit | `isPending` from mutation prevents re-submission |
| 11 | Slow mutation | All inputs disabled, spinner on button |
| 12 | 401 mid-request | Axios interceptor silently refreshes cookie via `/api/auth/refresh` |
| 13 | Refresh token expired | Interceptor redirects to `/login` |
| 14 | TanStack cache invalidation | `queryClient.setQueryData()` after mutation (no extra network call) |
| 15 | `isActive` toggle feedback | Badge updates optimistically; reverts if mutation fails |
| 16 | RTL layout | All Tailwind classes use logical properties (`ms-`, `me-`, `ps-`, `pe-`) |
| 17 | Language switch mid-form | `useTranslations` re-renders instantly; Zod re-validates in new locale on submit |
| 18 | Dashboard header shows dummy data | Fixed: wired to `useAuthStore` real user |
| 19 | TypeScript strict | All new files fully typed, no `any` except third-party workarounds |
| 20 | `restaurantId` not in `SessionUser` | Adding `restaurantId?` field to `SessionUser` type + login action |

---

## UI/UX Design Specifications

### Page Layout
- Two-tab header: `"Restaurant"` | `"My Account"` using Shadcn `<Tabs>`.
- Container: `max-w-4xl mx-auto px-6 py-8`, responsive.
- Each form section: separate `<Card>` with `<CardHeader>` (title + description) and `<CardContent>`.

### Restaurant Profile Form Visual Design
- **Dirty warning**: Full-width `<Alert>` with amber border, `AlertTriangle` icon, and warning message — appears between page header and form.
- **Description field**: `<Textarea>` rows=4, right-aligned character counter `n/500` in `text-xs text-muted-foreground`.
- **Logo URL**: Text input with an inline preview box below it: `<img src={logoUrl} ... className="h-20 w-20 rounded-lg object-cover border">`, hidden if URL is empty or invalid.
- **Status section**: Full-width row with restaurant name on left, `<Switch>` + `<RestaurantStatusBadge>` on right inside a `bg-muted/30 rounded-xl p-4` container.
- **Submit button**: `variant="default"`, right-aligned, `gap-2`, shows `<Loader2 className="animate-spin">` when pending.

### Empty State (`<NoRestaurantCard />`)
- Centered vertically in the tab content area.
- `AlertTriangle` icon, large `text-2xl font-semibold` title, `text-muted-foreground` subtitle.
- "Contact Admin" `<Button variant="outline">` with `Mail` icon.

### Skeleton
- Matches card structure: header skeleton bars + input field skeletons + button skeleton.
- Uses Shadcn `<Skeleton>` component.

---

## File Creation Summary

| Status | File |
|--------|------|
| NEW | `messages/dashboard/en.json` |
| NEW | `messages/dashboard/ar.json` |
| MODIFY | `i18n/request.ts` (merge dashboard messages) |
| MODIFY | `messages/en.json` (add Validation keys) |
| MODIFY | `messages/ar.json` (add Validation keys) |
| NEW | `schemas/restaurant.ts` |
| NEW | `lib/api/axios-client.ts` |
| MODIFY | `features/auth/auth.ts` (add `restaurantId` to `SessionUser`) |
| NEW | `features/restaurant/types.ts` |
| NEW | `features/restaurant/api/index.ts` |
| NEW | `features/restaurant/hooks/use-restaurant.ts` |
| NEW | `features/restaurant/components/restaurant-profile-skeleton.tsx` |
| NEW | `features/restaurant/components/no-restaurant-card.tsx` |
| NEW | `features/restaurant/components/restaurant-status-badge.tsx` |
| NEW | `features/restaurant/components/restaurant-profile-form.tsx` |
| NEW | `features/restaurant/components/restaurant-container.tsx` |
| NEW | `app/api/restaurant/me/route.ts` |
| NEW | `app/[locale]/dashboard/profile/page.tsx` |
| MODIFY | `app-sidebar.tsx` (real nav links + `useTranslations`) |
| MODIFY | `user-dropdown.tsx` (real auth store data + logout) |
| MODIFY | `site-header.tsx` (real avatar) |

---

## Verification Plan

### Automated
```bash
bun run tsc --noEmit
bun run lint
```

### Manual Test Matrix

| Scenario | Expected Result |
|----------|-----------------|
| `/en/dashboard/profile` as Manager | Restaurant form loads, pre-filled, EN labels |
| `/ar/dashboard/profile` as Manager | Arabic labels, RTL layout |
| Manager with no `restaurantId` | `<NoRestaurantCard />` renders cleanly |
| Admin with `restaurantId` | Same restaurant form as manager |
| Clear `name` field → submit | Zod: "Restaurant name must be at least 3 characters" |
| Enter invalid logo URL → submit | Zod: "Logo URL must be a valid web address" |
| Enter valid logo URL | Inline image preview renders below input |
| Submit unchanged form | Save button remains disabled |
| Submit valid changes | Mutation fires, toast success, `isDirty` resets |
| Token expires mid-session | Silent refresh, original request retried |
| Refresh token expired | Redirect to `/login` |
| Toggle `isActive` OFF → submit | Status badge updates to "Offline"; API PATCH called |
| `isActive` PATCH fails | Badge reverts to previous state |
| Language switch EN→AR mid-form | All labels switch; next submit uses Arabic Zod messages |
| Sidebar nav "Restaurant Profile" | Navigates to `/dashboard/profile`, item highlighted active |
| `UserDropdown` shows real name | Real first/last name + email from `useAuthStore` |
