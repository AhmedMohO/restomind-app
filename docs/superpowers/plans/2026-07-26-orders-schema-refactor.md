# Orders Schema Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every order-related TypeScript type in `restomind-app` an exact mirror of what the NestJS backend actually sends over the wire, and delete the ad-hoc "mapping"/re-hydration code that currently papers over two different backend response shapes being treated as one.

**Architecture:** The backend's `OrdersService` has exactly two response formatters — `formatOrderGroup` (a `GroupOrder`, whose `orders[]` are a *slim* nested sub-order shape) and `formatChildOrder` (a *standalone* restaurant order, richer, with a different item shape and field names). The current frontend types conflate these two into one `ApiRestaurantOrder`/`ApiOrderItem` pair, which is wrong for at least one of the two shapes at any call site and has caused real bugs (missing order numbers for manager/staff dashboards, a dead `groupOrderId` query param, a customer-PII leak fallback). This plan splits the types to match reality (`ApiGroupSubOrder` for the nested shape, `ApiRestaurantOrder` for the standalone shape) and simplifies the BFF code that previously stitched them together.

**Tech Stack:** Next.js App Router (frontend, TypeScript), NestJS + Mongoose (backend, `RestoMindAPI`). No test runner exists for either package for this module — verification is `npm run typecheck` plus manual dev-server smoke checks.

## Global Constraints

- No new abstractions beyond what's needed to represent the two real backend shapes. Don't invent a third "unified" type.
- Every field's optionality must match what the backend formatter actually guarantees (see "Ground truth" below) — no defensive `|| ""` / `?? []` fallbacks for fields the backend always sends.
- Do not touch unrelated modules (products, restaurants, etc.) even though they share some UI primitives.

## Ground truth (from `RestoMindAPI/src/orders/orders.service.ts`)

**`formatOrderGroup`** (used by `createOrder`, `getMyOrders`/`getAllMyOrders`, `getMyOrderById`, `getOrderGroupById`, `cancelOrderGroup`, and `getAllOrders` for `customer`/`admin` roles) returns:

```
{ _id, groupOrderId (== _id), user (ApiOrderUser | null), fullName, phoneNumber,
  emailAddress, deliveryMethod, deliveryAddress, paymentMethod, specialNotes?,
  overallStatus, totalOriginalPrice, totalDiscount, finalTotalPrice, totalQuantity,
  orders: [ { orderId, restaurant: {_id,name,logo?,image?}, status, items: [
      { productId, title, price, discountedPrice, quantity, lineTotal,
        offerId?, discountPercentage?, productImage? } ],
      totalOriginalPrice, totalDiscount, finalTotalPrice, totalQuantity, createdAt } ],
  createdAt, updatedAt }
```

Note: no top-level `items`, field is `user` not `userId`, nested sub-orders use `orderId` (not `_id`) and carry none of the group/customer fields.

**`formatChildOrder`** (used by `getChildOrderById`, `updateOrderStatus`, and `getAllOrders` for the `manager` role) returns:

```
{ _id, groupOrderId?, user (ApiOrderUser | null), restaurant: {_id,name,logo?,image?},
  items: [ { productId, productTitle, productImage?, offerId?, restaurantId,
      restaurantName, originalPrice, offerPrice, discountPercentage, quantity,
      lineTotal, purchasedAt } ],
  totalOriginalPrice, totalDiscount, finalTotalPrice, totalQuantity,
  fullName, phoneNumber, emailAddress, deliveryMethod, deliveryAddress, specialNotes?,
  paymentMethod, status, createdAt, updatedAt }
```

Note: no `orderId` (uses `_id`), completely different item field names than the nested shape above.

**Known backend bugs found while tracing this** (fixed in Task 1):
- `getAllOrders` has no branch for `RolesEnum.STAFF` — staff fall through to the admin/system-wide branch and get back `GroupOrder[]` (via `formatOrderGroup`) instead of the restaurant-scoped `formatChildOrder[]` that `manager` gets and that the frontend's `getRestaurantOrders` assumes.
- `updateOrderStatus(id, status, currentUser)` takes no `groupOrderId` — the frontend has been sending one as a dead query param end-to-end.

---

### Task 1: Backend — scope `staff` the same as `manager` in `getAllOrders`

**Files:**
- Modify: `RestoMindAPI/src/orders/orders.service.ts:1225` (the `if (currentUser.role === RolesEnum.MANAGER) {` branch inside `getAllOrders`)

**Interfaces:**
- Consumes: `RolesEnum.STAFF` from `src/Common/Types` (already imported in this file as `RolesEnum`).
- Produces: no change to any exported signature — same `getAllOrders(query, currentUser)` shape.

- [ ] **Step 1: Widen the manager branch's role check**

Change:
```ts
    // SCENARIO 2: RESTAURANT MANAGER -> Child Orders owned by manager's restaurant
    if (currentUser.role === RolesEnum.MANAGER) {
```
to:
```ts
    // SCENARIO 2: RESTAURANT MANAGER / STAFF -> Child Orders owned by their restaurant
    if (
      currentUser.role === RolesEnum.MANAGER ||
      currentUser.role === RolesEnum.STAFF
    ) {
```

- [ ] **Step 2: Verify**

Run: `cd "F:/Work/ITI Project/restomind/RestoMindAPI" && npx tsc --noEmit -p tsconfig.json` (or the project's existing build command if `tsc` isn't wired standalone — check `package.json` first with `cat package.json`).
Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
cd "F:/Work/ITI Project/restomind/RestoMindAPI"
git add src/orders/orders.service.ts
git commit -m "fix(orders): scope staff role like manager in getAllOrders"
```

---

### Task 2: Frontend — rewrite `features/orders/api/type.ts`

**Files:**
- Modify: `features/orders/api/type.ts` (full rewrite of the interfaces below; keep `CreateOrderAddress`/`CreateOrderPayload` and the final `export * from "./dashboard-types"` unchanged)

**Interfaces:**
- Produces: `OrderStatus`, `OverallOrderStatus`, `DeliveryMethod`, `PaymentMethod`, `ApiDeliveryAddress`, `PaginatedResponse<T>`, `ApiRestaurant`, `ApiOrderItem`, `ApiGroupSubOrder`, `ApiOrderGroup` — all consumed by every other task below.

- [ ] **Step 1: Replace the type definitions**

Replace the file's content from the top through the end of `ApiOrderGroup` (i.e. everything before the `CreateOrderAddress` comment) with:

```ts
import type { ApiOrderUser } from "./dashboard-types"

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"

/** Aggregate status shown on a group when its sub-orders don't all match. */
export type OverallOrderStatus =
  | OrderStatus
  | "Partially Delivered"
  | "Partially Cancelled"
  | "Processing"

/** Fulfilment method supported by the orders API. */
export type DeliveryMethod = "Home Delivery" | "Store Pickup"

/** Payment methods returned by the API (only COD can be submitted today). */
export type PaymentMethod = "Cash on Delivery" | "Credit / Debit Card"

export interface ApiDeliveryAddress {
  addressId?: string
  street: string
  city: string
  country: string
}

/** Paginated wrapper returned by every listing endpoint of the orders module. */
export interface PaginatedResponse<T> {
  data: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ApiRestaurant {
  _id: string
  name: string
  logo?: string
  image?: string
}

/** Line item as returned inside a group's per-restaurant sub-order. */
export interface ApiOrderItem {
  productId: string
  title: string
  price: number
  discountedPrice: number
  quantity: number
  lineTotal: number
  offerId?: string
  discountPercentage?: number
  productImage?: string
}

/** A group's sub-order for one restaurant — `ApiOrderGroup.orders[]`. */
export interface ApiGroupSubOrder {
  orderId: string
  restaurant: ApiRestaurant
  status: OrderStatus
  items: ApiOrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  createdAt: string
}

export interface ApiOrderGroup {
  _id: string
  groupOrderId: string
  user: ApiOrderUser | null
  fullName: string
  phoneNumber: string
  emailAddress: string
  deliveryMethod: DeliveryMethod
  deliveryAddress: ApiDeliveryAddress | null
  specialNotes?: string
  paymentMethod: PaymentMethod
  overallStatus: OverallOrderStatus
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  orders: ApiGroupSubOrder[]
  createdAt: string
  updatedAt: string
}
```

Remove the `import { ApiProduct } from "@/features/products/api"` line entirely (no longer used — `productId` is a plain `string`).

- [ ] **Step 2: Verify the rest of the file is untouched**

The file should still end with the unchanged `CreateOrderAddress`, `CreateOrderPayload` interfaces and `export * from "./dashboard-types"`.

- [ ] **Step 3: Commit** (bundle with Task 3 — both files must land together or the build won't typecheck)

---

### Task 3: Frontend — rewrite `features/orders/api/dashboard-types.ts`

**Files:**
- Modify: `features/orders/api/dashboard-types.ts`

**Interfaces:**
- Consumes: `ApiDeliveryAddress`, `ApiRestaurant`, `DeliveryMethod`, `OrderStatus`, `PaginatedResponse`, `PaymentMethod` from `./type` (Task 2).
- Produces: `ApiOrderUser`, `ApiChildOrderItem`, `ApiRestaurantOrder` (now the **standalone** shape only), `UpdateOrderStatusPayload`, `QueryOrderListingParams`, `DashboardOrderRow`, `PaginatedDashboardOrders`, `DashboardOrdersSummary`.

- [ ] **Step 1: Replace `ApiOrderUser` through `ApiRestaurantOrder`**

Replace everything from the top of the file through the end of the old `ApiRestaurantOrder` interface with:

```ts
import type {
  ApiDeliveryAddress,
  ApiRestaurant,
  DeliveryMethod,
  OrderStatus,
  PaginatedResponse,
  PaymentMethod,
} from "./type"

export interface ApiOrderUser {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  gender?: string
  phone?: string
  isEmailVerified?: boolean
  DOB?: string
  isDeleted?: boolean
  addresses?: unknown[]
  createdAt?: string
  updatedAt?: string
  id?: string
}

/** Line item as returned inside a standalone restaurant order. */
export interface ApiChildOrderItem {
  productId: string
  productTitle: string
  productImage?: string
  offerId?: string
  restaurantId: string
  restaurantName: string
  originalPrice: number
  offerPrice: number
  discountPercentage: number
  quantity: number
  lineTotal: number
  purchasedAt: string
}

/**
 * A standalone restaurant order — `GET /orders/:id`, the response of
 * `PATCH /orders/:id/status`, and the manager/staff listing branch of
 * `GET /orders`. Distinct from `ApiGroupSubOrder`, which is the slimmer shape
 * nested inside `ApiOrderGroup.orders[]`.
 */
export interface ApiRestaurantOrder {
  _id: string
  groupOrderId?: string
  user: ApiOrderUser | null
  restaurant: ApiRestaurant
  items: ApiChildOrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  fullName: string
  phoneNumber: string
  emailAddress: string
  deliveryMethod: DeliveryMethod
  deliveryAddress: ApiDeliveryAddress | null
  specialNotes?: string
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Leave `UpdateOrderStatusPayload` through `DashboardOrdersSummary` unchanged**

Everything from `export interface UpdateOrderStatusPayload` to the end of the file stays as-is.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: errors only in the consumer files fixed by later tasks (dashboard-row.ts, dashboard.ts, the components, the hooks, the routes) — not in `type.ts`/`dashboard-types.ts` themselves. Note every error you see; each should map to a task below.

- [ ] **Step 4: Commit**

```bash
git add features/orders/api/type.ts features/orders/api/dashboard-types.ts
git commit -m "refactor(orders): split ApiRestaurantOrder into the two real backend shapes"
```

---

### Task 4: Frontend — fix `features/orders/dashboard-row.ts`

**Files:**
- Modify: `features/orders/dashboard-row.ts`

**Interfaces:**
- Consumes: `ApiOrderGroup` (Task 2), `ApiOrderUser`/`ApiRestaurantOrder` (Task 3, standalone shape).
- Produces: `groupToDashboardRow(group: ApiOrderGroup): DashboardOrderRow`, `subOrderToDashboardRow(order: ApiRestaurantOrder): DashboardOrderRow` — consumed by Task 5 (`dashboard.ts`).

**Why this needs to change:** `subOrderToDashboardRow` currently reads `order.orderId`, which only exists on the nested-in-group shape. The manager/staff listing (`getRestaurantOrders`) actually returns the standalone `formatChildOrder` shape, which has `_id`, not `orderId` — so today the dashboard table's "reference" column is silently empty for every manager/staff row. Task 3's type split makes this a compile error, which this task fixes at the source.

- [ ] **Step 1: Rewrite the file**

```ts
/**
 * Turns the two upstream order listing shapes into the single
 * `DashboardOrderRow` rendered by the dashboard table.
 *
 *   admin           → `GET /orders`                        → ApiOrderGroup
 *   manager / staff → `GET /orders/restaurant/:restaurantId` → ApiRestaurantOrder
 *
 * Pure functions — safe to import from route handlers and components alike.
 */

import type { ApiOrderGroup } from "./api/type"
import type {
  ApiOrderUser,
  ApiRestaurantOrder,
  DashboardOrderRow,
} from "./api/dashboard-types"

const MAX_LISTED_RESTAURANTS = 2

function userFullName(user: ApiOrderUser | null): string {
  if (!user) return ""
  return [user.firstName, user.lastName].filter(Boolean).join(" ")
}

function userContact(user: ApiOrderUser | null): string {
  if (!user) return ""
  return user.email ?? user.phone ?? ""
}

/** "Pizza Co, Burger Hub +2" — keeps wide multi-restaurant groups readable. */
function joinRestaurantNames(names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))]
  if (unique.length === 0) return ""
  if (unique.length <= MAX_LISTED_RESTAURANTS) return unique.join(", ")
  return `${unique.slice(0, MAX_LISTED_RESTAURANTS).join(", ")} +${
    unique.length - MAX_LISTED_RESTAURANTS
  }`
}

function restaurantNamesOf(group: ApiOrderGroup): string[] {
  return group.orders.map((order) => order.restaurant.name)
}

export function groupToDashboardRow(group: ApiOrderGroup): DashboardOrderRow {
  const id = group.groupOrderId
  return {
    id,
    reference: id.slice(-8).toUpperCase(),
    customerName: group.fullName || userFullName(group.user) || "-",
    customerContact:
      group.emailAddress || group.phoneNumber || userContact(group.user) || "-",
    restaurantName: joinRestaurantNames(restaurantNamesOf(group)) || "-",
    finalTotalPrice: group.finalTotalPrice,
    totalQuantity: group.totalQuantity,
    deliveryMethod: group.deliveryMethod,
    createdAt: group.createdAt,
  }
}

export function subOrderToDashboardRow(
  order: ApiRestaurantOrder
): DashboardOrderRow {
  const id = order._id
  return {
    id,
    reference: id.slice(-8).toUpperCase(),
    customerName: order.fullName || userFullName(order.user) || "-",
    customerContact:
      order.emailAddress || order.phoneNumber || userContact(order.user) || "-",
    restaurantName: order.restaurant.name || "-",
    finalTotalPrice: order.finalTotalPrice,
    totalQuantity: order.totalQuantity,
    deliveryMethod: order.deliveryMethod,
    createdAt: order.createdAt,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add features/orders/dashboard-row.ts
git commit -m "fix(orders): read the standalone order id in subOrderToDashboardRow"
```

---

### Task 5: Frontend — simplify `features/orders/api/dashboard.ts`

**Files:**
- Modify: `features/orders/api/dashboard.ts`

**Interfaces:**
- Consumes: `ApiOrderGroup`, `ApiGroupSubOrder`, `OverallOrderStatus` (Task 2).
- Produces: same exported signatures as before (`listDashboardOrders`, `getDashboardOrdersSummary`, `getDashboardOrderGroup`, `parseOrderListingParams`, `DONE_ORDER_STATUS`, `ORDER_DASHBOARD_ROLES`) — no consumer of this module needs to change.

**Why this needs to change:** `getDashboardOrderGroup` currently re-fetches a manager/staff's own restaurant via `getRestaurantOrders` (which returns the *standalone* shape) and splices those objects into `group.orders` (typed as the *nested* shape) — exactly the kind of shape-mismatch mapping this refactor removes. `getOrderGroupById` already returns the group with every restaurant's nested sub-order correctly shaped; scoping down to one restaurant only requires **filtering that array**, not a second fetch through a different endpoint. This also fixes a real bug: today, if the re-fetch/search comes back empty (network hiccup, or the restaurant genuinely isn't part of the group), the function falls back to returning the **entire unfiltered group**, leaking every other restaurant's order data and the customer's contact info to a manager/staff account that shouldn't see it.

- [ ] **Step 1: Replace the group-details section**

Replace `getDashboardOrderGroup`, `findSubOrders`, and `withSubOrders` (everything from `/** Group / order details for a dashboard user. */` to the end of the file) with:

```ts
/**
 * Group / order details for a dashboard user.
 *
 * Admins reach `GET /orders/group/:id` and see every restaurant's sub-order.
 * Managers and staff reach the same endpoint but are scoped down to their own
 * restaurant's sub-order within the group.
 */
export async function getDashboardOrderGroup(
  user: SessionUser,
  id: string
): Promise<ApiOrderGroup> {
  const { data: group } = await getOrderGroupById(id)

  if (isAdmin(user)) return group

  const restaurantId = ownRestaurantId(user)
  const scopedOrders = group.orders.filter(
    (order) => order.restaurant._id === restaurantId
  )

  if (scopedOrders.length === 0) {
    throw new AuthorizationError("This order does not belong to your restaurant")
  }

  return withSubOrders(group, scopedOrders)
}

/** Replaces a group's sub-orders and recomputes the totals that follow. */
function withSubOrders(
  group: ApiOrderGroup,
  orders: ApiGroupSubOrder[]
): ApiOrderGroup {
  const sum = (
    key: "totalOriginalPrice" | "totalDiscount" | "finalTotalPrice" | "totalQuantity"
  ) => orders.reduce((acc, order) => acc + order[key], 0)

  // With a single restaurant in view (manager/staff) the group badge must show
  // that restaurant's status, not the aggregate of the whole group.
  const statuses = new Set(orders.map((order) => order.status))
  const overallStatus: OverallOrderStatus =
    statuses.size === 1 ? orders[0].status : group.overallStatus

  return {
    ...group,
    orders,
    overallStatus,
    totalOriginalPrice: sum("totalOriginalPrice"),
    totalDiscount: sum("totalDiscount"),
    finalTotalPrice: sum("finalTotalPrice"),
    totalQuantity: sum("totalQuantity"),
  }
}
```

- [ ] **Step 2: Fix the imports at the top of the file**

Replace:
```ts
import {
  getAllOrders,
  getChildOrderById,
  getOrderGroupById,
  getRestaurantOrders,
} from "./index"
import type {
  ApiOrderGroup,
  ApiRestaurantOrder,
  OrderStatus,
  PaginatedResponse,
  QueryOrderListingParams,
} from "./type"
```
with:
```ts
import { getAllOrders, getOrderGroupById, getRestaurantOrders } from "./index"
import type {
  ApiGroupSubOrder,
  ApiOrderGroup,
  OrderStatus,
  OverallOrderStatus,
  PaginatedResponse,
  QueryOrderListingParams,
} from "./type"
```
(`getChildOrderById` and `ApiRestaurantOrder` are no longer referenced anywhere in this file.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors in `features/orders/api/dashboard.ts`.

- [ ] **Step 4: Commit**

```bash
git add features/orders/api/dashboard.ts
git commit -m "refactor(orders): scope manager/staff group details by filtering, not re-fetching"
```

---

### Task 6: Frontend — drop the dead `groupOrderId` param from `updateOrderStatus`

**Files:**
- Modify: `features/orders/api/index.ts:133-146` (`updateOrderStatus`)
- Modify: `app/api/orders/[id]/status/route.ts`
- Modify: `features/orders/hooks/use-dashboard-orders.ts:81-105` (`useUpdateOrderStatus`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `updateOrderStatus(id: string, status: OrderStatus): Promise<{ data: ApiRestaurantOrder }>`; `useUpdateOrderStatus()` mutation now takes `{ id, status }` (no `groupOrderId`) — consumed by Task 7 (`dashboard-order-details.tsx`).

**Why:** the NestJS `updateOrderStatus(id, status, currentUser)` service method (`RestoMindAPI/src/orders/orders.service.ts:912`) takes no `groupOrderId` at all — the group's `overallStatus` is recomputed server-side automatically from `order.groupOrderId`. The frontend has been threading a `groupOrderId` query param through four files for a backend parameter that doesn't exist.

- [ ] **Step 1: `features/orders/api/index.ts`**

Replace:
```ts
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  groupOrderId?: string
): Promise<{ data: ApiRestaurantOrder }> {
  const response = await apiClient(
    `/orders/${encodeURIComponent(id)}/status${buildQueryString({ groupOrderId })}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  )
  return parseOrThrow<{ data: ApiRestaurantOrder }>(response, "updateOrderStatus")
}
```
with:
```ts
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<{ data: ApiRestaurantOrder }> {
  const response = await apiClient(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<{ data: ApiRestaurantOrder }>(response, "updateOrderStatus")
}
```

- [ ] **Step 2: `app/api/orders/[id]/status/route.ts`**

Replace:
```ts
  const { id } = await params
  const groupOrderId = new URL(request.url).searchParams.get("groupOrderId")

  try {
    const result = await updateOrderStatus(
      id,
      parsed.data.status,
      groupOrderId ?? undefined
    )
```
with:
```ts
  const { id } = await params

  try {
    const result = await updateOrderStatus(id, parsed.data.status)
```

- [ ] **Step 3: `features/orders/hooks/use-dashboard-orders.ts`**

Replace:
```ts
  return useMutation({
    mutationFn: async ({
      id,
      status,
      groupOrderId,
    }: {
      id: string
      status: OrderStatus
      groupOrderId?: string
    }) => {
      const data = await clientFetch<ApiRestaurantOrder>(
        `/orders/${encodeURIComponent(id)}/status${buildQueryString({ groupOrderId })}`,
        { method: "PATCH", body: { status } }
      )
      if (!data) throw new Error("Failed to update order status")
      return data
    },
```
with:
```ts
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const data = await clientFetch<ApiRestaurantOrder>(
        `/orders/${encodeURIComponent(id)}/status`,
        { method: "PATCH", body: { status } }
      )
      if (!data) throw new Error("Failed to update order status")
      return data
    },
```

If `buildQueryString` becomes unused in `use-dashboard-orders.ts` after this edit (check the rest of the file — `useDashboardOrders` and `useDashboardOrdersSummary` still call it), leave the import; otherwise remove it.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 5: Commit**

```bash
git add features/orders/api/index.ts app/api/orders/\[id\]/status/route.ts features/orders/hooks/use-dashboard-orders.ts
git commit -m "refactor(orders): remove the groupOrderId param the backend never reads"
```

---

### Task 7: Frontend — retype the nested sub-order across components

**Files:**
- Modify: `features/orders/components/OrderDetailsPage.tsx`
- Modify: `features/orders/components/RestaurantOrderCarousel.tsx`
- Modify: `features/orders/components/RestaurantOrderCard.tsx`
- Modify: `features/orders/components/PurchaseCard.tsx`
- Modify: `features/orders/components/dashboard-order-details.tsx`

**Interfaces:**
- Consumes: `ApiGroupSubOrder` (Task 2), `useUpdateOrderStatus`'s new `{ id, status }` mutation shape (Task 6).

**Why:** every one of these components receives its `order` from `ApiOrderGroup.orders[]` — the nested shape — but was typed as `ApiRestaurantOrder`, which Task 3 turned into the *standalone* shape. Retype them to `ApiGroupSubOrder`, the type that's actually correct for what they receive.

- [ ] **Step 1: `OrderDetailsPage.tsx`**

Replace:
```ts
import type {
  ApiOrderGroup,
  ApiRestaurantOrder,
} from "@/features/orders/api/type"
```
with:
```ts
import type {
  ApiGroupSubOrder,
  ApiOrderGroup,
} from "@/features/orders/api/type"
```
and change the prop type:
```ts
  renderStatusControl?: (order: ApiGroupSubOrder) => ReactNode
```

- [ ] **Step 2: `RestaurantOrderCarousel.tsx`**

Replace:
```ts
import type {
  ApiOrderGroup,
  ApiRestaurantOrder,
  OrderStatus,
} from "@/features/orders/api/type"
```
with:
```ts
import type {
  ApiGroupSubOrder,
  ApiOrderGroup,
  OrderStatus,
} from "@/features/orders/api/type"
```
and change the prop type:
```ts
  renderStatusControl?: (order: ApiGroupSubOrder) => ReactNode
```

- [ ] **Step 3: `RestaurantOrderCard.tsx`**

Replace:
```ts
import type {
  ApiOrderItem,
  ApiRestaurantOrder,
} from "@/features/orders/api/type"
```
with:
```ts
import type {
  ApiGroupSubOrder,
  ApiOrderItem,
} from "@/features/orders/api/type"
```
Change the prop type `order: ApiRestaurantOrder` to `order: ApiGroupSubOrder`. Simplify:
```ts
  const orderId = order.orderId || ""
  const shortOrderId = orderId.slice(-8).toUpperCase()
```
to:
```ts
  const shortOrderId = order.orderId.slice(-8).toUpperCase()
```
(and drop the now-unused `orderId` local — check the rest of the component doesn't reference it elsewhere; it doesn't).

- [ ] **Step 4: `PurchaseCard.tsx`**

No import changes (it never imports `ApiRestaurantOrder` by name — the type flows through `ApiOrderGroup.orders`). Replace:
```ts
          const targetOrderId =
            restaurantOrder.orderId || restaurantOrder._id || ""
```
with:
```ts
          const targetOrderId = restaurantOrder.orderId
```

- [ ] **Step 5: `dashboard-order-details.tsx`**

Replace:
```ts
import type {
  ApiRestaurantOrder,
  OrderStatus,
} from "@/features/orders/api/type"
```
with:
```ts
import type {
  ApiGroupSubOrder,
  OrderStatus,
} from "@/features/orders/api/type"
```

Replace:
```ts
function subOrderId(order: ApiRestaurantOrder): string {
  return order.orderId || ""
}
```
with:
```ts
function subOrderId(order: ApiGroupSubOrder): string {
  return order.orderId
}
```

Replace the callback (drop the dead `groupOrderId` argument — `ApiGroupSubOrder` doesn't carry one, and Task 6 already dropped it from the mutation):
```ts
  const handleStatusChange = React.useCallback(
    async (order: ApiRestaurantOrder, status: OrderStatus) => {
      const id = subOrderId(order)
      if (!id || status === order.status) return

      setUpdatingId(id)
      try {
        await updateStatus.mutateAsync({
          id,
          status,
          groupOrderId: order.groupOrderId,
        })
        toast.success(t("statusUpdateSuccess"))
      } catch (err) {
        console.error("[DashboardOrderDetails] status update failed", err)
        toast.error(getErrorMessage(err, t("statusUpdateError")))
      } finally {
        setUpdatingId(null)
      }
    },
    [t, updateStatus]
  )

  const renderStatusControl = React.useCallback(
    (order: ApiRestaurantOrder) => (
```
with:
```ts
  const handleStatusChange = React.useCallback(
    async (order: ApiGroupSubOrder, status: OrderStatus) => {
      const id = subOrderId(order)
      if (status === order.status) return

      setUpdatingId(id)
      try {
        await updateStatus.mutateAsync({ id, status })
        toast.success(t("statusUpdateSuccess"))
      } catch (err) {
        console.error("[DashboardOrderDetails] status update failed", err)
        toast.error(getErrorMessage(err, t("statusUpdateError")))
      } finally {
        setUpdatingId(null)
      }
    },
    [t, updateStatus]
  )

  const renderStatusControl = React.useCallback(
    (order: ApiGroupSubOrder) => (
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: zero errors across the whole `features/orders` tree.

- [ ] **Step 7: Commit**

```bash
git add features/orders/components/OrderDetailsPage.tsx features/orders/components/RestaurantOrderCarousel.tsx features/orders/components/RestaurantOrderCard.tsx features/orders/components/PurchaseCard.tsx features/orders/components/dashboard-order-details.tsx
git commit -m "refactor(orders): retype components to the real nested sub-order shape"
```

---

### Task 8: Frontend — clean up `OrderHeader.tsx`'s redundant id fallback

**Files:**
- Modify: `features/orders/components/OrderHeader.tsx`

**Interfaces:**
- Consumes: `ApiOrderGroup.groupOrderId: string` (Task 2 — always present, never falsy).

- [ ] **Step 1: Simplify the duplicated fallback**

Replace:
```ts
  const displayId =
    orderGroup.groupOrderId || orderGroup.groupOrderId || orderGroup._id || ""
  const shortDisplayId = displayId ? displayId.slice(-8).toUpperCase() : ""
```
with:
```ts
  const displayId = orderGroup.groupOrderId
  const shortDisplayId = displayId.slice(-8).toUpperCase()
```

The rest of the file (the `handleCancel` guard `if (!displayId) return`, etc.) can stay — `displayId` is just no longer possibly empty, so that guard is now dead but harmless; leave it rather than restructuring the function for a one-line simplification.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add features/orders/components/OrderHeader.tsx
git commit -m "refactor(orders): drop redundant groupOrderId fallback"
```

---

### Task 9: Docs — sync `docs/API_DOCUMENTATION.md`'s Order/GroupOrder schema

**Files:**
- Modify: `docs/API_DOCUMENTATION.md` (the `### Order & GroupOrder Schemas` section, currently around line 320-386)

**Why:** the doc currently has the same conflation problem as the old frontend types — one `Order`/`OrderItem` pair reused for both the nested-in-group and standalone shapes, with `title` where the standalone shape actually sends `productTitle`.

- [ ] **Step 1: Replace the section**

Replace the whole fenced block under `### Order & GroupOrder Schemas` with:

```typescript
/** Line item inside a group's per-restaurant sub-order (GroupOrder.orders[].items). */
interface GroupOrderItem {
  productId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  lineTotal: number;
  offerId?: string;
  discountPercentage?: number;
  productImage?: string;
}

/** A group's sub-order for one restaurant — nested inside GroupOrder.orders[]. */
interface GroupSubOrder {
  orderId: string;
  restaurant: { _id: string; name: string; logo?: string; image?: string };
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  items: GroupOrderItem[];
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  createdAt: string;
}

interface DeliveryAddress {
  addressId?: string;
  street: string;
  city: string;
  country: string;
}

interface GroupOrder {
  _id: string;
  groupOrderId: string;         // same value as _id
  user: User | null;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  deliveryMethod: 'Home Delivery' | 'Store Pickup';
  deliveryAddress: DeliveryAddress | null;
  specialNotes?: string;
  paymentMethod: 'Cash on Delivery';
  overallStatus: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled' | 'Partially Delivered' | 'Partially Cancelled' | 'Processing';
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  orders: GroupSubOrder[];       // one entry per restaurant in this group
  createdAt: string;
  updatedAt: string;
}

/** Line item inside a standalone restaurant order (different field names from GroupOrderItem). */
interface OrderItem {
  productId: string;
  productTitle: string;
  productImage?: string;
  offerId?: string;
  restaurantId: string;
  restaurantName: string;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  quantity: number;
  lineTotal: number;            // quantity * offerPrice
  purchasedAt: string;          // ISO Date string
}

/**
 * A standalone restaurant order — GET /orders/:id, the response of
 * PATCH /orders/:id/status, and the manager/staff branch of GET /orders.
 * Distinct from GroupSubOrder above (different item shape, uses `_id` not `orderId`).
 */
interface Order {
  _id: string;
  groupOrderId?: string;
  user: User | null;
  restaurant: { _id: string; name: string; logo?: string; image?: string };
  items: OrderItem[];
  totalOriginalPrice: number;
  totalDiscount: number;
  finalTotalPrice: number;
  totalQuantity: number;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  deliveryMethod: 'Home Delivery' | 'Store Pickup';
  deliveryAddress: DeliveryAddress | null;
  specialNotes?: string;
  paymentMethod: 'Cash on Delivery';
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}
```

If the doc defines a `User` interface elsewhere (search for `interface User` before this section), keep the `User` reference as-is; if it doesn't exist yet, use `Record<string, unknown>` in its place instead of inventing a full `User` schema in this PR.

- [ ] **Step 2: Check for other stale references in the same doc**

Search the file for the old merged assumption (`grep -n "orderId" docs/API_DOCUMENTATION.md` and `grep -n '"userId"' docs/API_DOCUMENTATION.md` restricted to the orders section, e.g. around the example JSON near line 1360-1470 and 2629) and update any example JSON payloads that show `userId` instead of `user`, or a `title` field on what's actually a standalone order's items.

- [ ] **Step 3: Commit**

```bash
git add docs/API_DOCUMENTATION.md
git commit -m "docs(orders): document GroupSubOrder and Order as the two distinct shapes they are"
```

---

### Task 10: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Typecheck both packages**

```bash
cd "F:/Work/ITI Project/restomind/restomind-app" && npm run typecheck
```
Expected: 0 errors.

```bash
cd "F:/Work/ITI Project/restomind/RestoMindAPI" && cat package.json
```
Find the correct typecheck/build command for this package (it may not have a standalone `typecheck` script — `nest build` or `tsc --noEmit -p tsconfig.json` are likely candidates) and run it.
Expected: 0 new errors compared to `git stash` (the STAFF-role change is a 3-line diff, so any error must be pre-existing — verify with `git stash` + re-run if anything looks suspicious, then `git stash pop`).

- [ ] **Step 2: Manual smoke test — customer**

Start the dev server, log in as a `customer`, and check:
- `/orders` — list renders, search/sort/pagination/tabs work, each card shows a real order number.
- `/orders/[groupOrderId]` — details page renders every restaurant's sub-order, cancel button appears only for cancellable statuses and works.

- [ ] **Step 3: Manual smoke test — admin**

Log in as `admin` and check `/dashboard/orders` (list shows every group, reference numbers populated) and `/dashboard/orders/[id]` (all restaurants in the group visible, status can be advanced per sub-order).

- [ ] **Step 4: Manual smoke test — manager and staff**

Log in as each and check `/dashboard/orders` (list scoped to their own restaurant, reference numbers populated — this is the row that was silently broken before Task 4) and `/dashboard/orders/[id]` for a multi-restaurant group (only their own restaurant's sub-order is visible, not the others' — this is the scoping path rewritten in Task 5).

- [ ] **Step 5: No further commit** — this task is verification-only. If anything fails, go back to the relevant task, fix, re-run its typecheck, and commit the fix there rather than bundling it here.
