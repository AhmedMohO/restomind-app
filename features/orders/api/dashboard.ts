/**
 * Role-aware order access for the dashboard (server-only).
 *
 * A single place decides *which* upstream endpoint a dashboard user may reach:
 *
 *   admin            → the whole platform (`/orders`, `/orders/group/:id`)
 *   manager / staff  → their own restaurant only (`/orders/restaurant/:id`)
 *
 * Route handlers stay thin and can never accidentally widen a manager's or a
 * staff member's scope, because the restaurant id always comes from the session
 * rather than from the request.
 */

import "server-only"

import { AuthorizationError } from "@/lib/auth/errors"
import type { SessionUser } from "@/features/auth/auth"
import {
  getAllOrders,
  getOrderGroupById,
  getRestaurantOrders,
} from "./index"
import type {
  ApiOrderGroup,
  OrderStatus,
  PaginatedResponse,
  QueryOrderListingParams,
} from "./type"
import type {
  DashboardOrderRow,
  DashboardOrdersSummary,
} from "./dashboard-types"
import { groupToDashboardRow, subOrderToDashboardRow } from "../dashboard-row"

/** Status treated as "done" by the dashboard completion counter. */
export const DONE_ORDER_STATUS: OrderStatus = "Delivered"

/** Roles allowed on the dashboard order screens. */
export const ORDER_DASHBOARD_ROLES = ["admin", "manager", "staff"] as const

const NUMERIC_QUERY_KEYS = [
  "page",
  "limit",
  "minTotalPrice",
  "maxTotalPrice",
] as const

const STRING_QUERY_KEYS = [
  "search",
  "status",
  "paymentMethod",
  "deliveryMethod",
  "startDate",
  "endDate",
  "restaurantId",
  "sortBy",
  "sort",
  "sortOrder",
  "order",
] as const

/** Whitelists the listing query parameters accepted from the browser. */
export function parseOrderListingParams(
  searchParams: URLSearchParams
): QueryOrderListingParams {
  const params: QueryOrderListingParams = {}

  for (const key of NUMERIC_QUERY_KEYS) {
    const value = searchParams.get(key)
    if (value) params[key] = Number(value)
  }
  for (const key of STRING_QUERY_KEYS) {
    const value = searchParams.get(key)
    if (value) params[key] = value as never
  }

  return params
}

function isAdmin(user: SessionUser): boolean {
  return user.role === "admin"
}

/** The restaurant a manager/staff member is scoped to, or throws 403. */
function ownRestaurantId(user: SessionUser): string {
  if (!user.restaurantId) {
    throw new AuthorizationError("No restaurant is assigned to your account")
  }
  return user.restaurantId
}

/** Listing scoped to the caller's role, normalised into table rows. */
export async function listDashboardOrders(
  user: SessionUser,
  params: QueryOrderListingParams
): Promise<PaginatedResponse<DashboardOrderRow>> {
  if (isAdmin(user)) {
    const page = await getAllOrders(params)
    return { ...page, data: page.data.map(groupToDashboardRow) }
  }

  // A manager/staff member is pinned to their own restaurant — any incoming
  // `restaurantId` filter is ignored on purpose.
  const page = await getRestaurantOrders(ownRestaurantId(user), {
    ...params,
    restaurantId: undefined,
  })
  return { ...page, data: page.data.map(subOrderToDashboardRow) }
}

/** Total vs. completed counts for the active filters (two cheap count reads). */
export async function getDashboardOrdersSummary(
  user: SessionUser,
  params: QueryOrderListingParams
): Promise<DashboardOrdersSummary> {
  const countParams: QueryOrderListingParams = {
    ...params,
    page: 1,
    limit: 1,
    status: undefined,
  }

  const [all, done] = await Promise.all([
    listDashboardOrders(user, countParams),
    listDashboardOrders(user, { ...countParams, status: DONE_ORDER_STATUS }),
  ])

  return { total: all.totalItems, done: done.totalItems }
}

/**
 * Group details for a dashboard user.
 *
 * `GET /orders/group/:id` returns the group with a flat `items[]` and no
 * sub-orders, so the real sub-orders (their ids and per-restaurant statuses,
 * which the status control needs) are hydrated from
 * `GET /orders/restaurant/:restaurantId?search=<groupId>` — one call per
 * restaurant involved for an admin, exactly one for a manager or staff member.
 *
 * Managers and staff never receive another restaurant's sub-orders.
 */
export async function getDashboardOrderGroup(
  user: SessionUser,
  id: string
): Promise<ApiOrderGroup> {
  const { data: group } = await getOrderGroupById(id)

  const restaurantIds = isAdmin(user)
    ? [...new Set(group.orders.map((order) => order.restaurant._id).filter(Boolean))]
    : [ownRestaurantId(user)]

  const groupId = group.orderGroupId || id
  const hydrated = (
    await Promise.all(
      restaurantIds.map((restaurantId) =>
        findSubOrders(restaurantId, groupId).catch(() => [])
      )
    )
  ).flat()

  if (hydrated.length === 0) {
    if (isAdmin(user)) return group
    // A manager/staff member with no sub-order in this group has no business
    // seeing it — the upstream group endpoint does not scope staff at all.
    throw new AuthorizationError("This order does not belong to your restaurant")
  }

  return withSubOrders(group, hydrated)
}

/** Sub-orders of a group belonging to one restaurant. */
async function findSubOrders(
  restaurantId: string,
  groupOrderId: string
): Promise<ApiOrderGroup["orders"]> {
  const page = await getRestaurantOrders(restaurantId, {
    search: groupOrderId,
    limit: 50,
  })
  return page.data.filter(
    (order) => !order.groupOrderId || order.groupOrderId === groupOrderId
  )
}

/** Replaces a group's sub-orders and recomputes the totals that follow. */
function withSubOrders(
  group: ApiOrderGroup,
  orders: ApiOrderGroup["orders"]
): ApiOrderGroup {
  const sum = (
    key: "totalOriginalPrice" | "totalDiscount" | "finalTotalPrice" | "totalQuantity"
  ) => orders.reduce((acc, order) => acc + (order[key] ?? 0), 0)

  // With a single restaurant in view (manager/staff) the group badge must show
  // that restaurant's status, not the aggregate of the whole group.
  const statuses = new Set(orders.map((order) => order.status))
  const overallStatus =
    statuses.size === 1 ? orders[0].status : group.overallStatus

  return {
    ...group,
    orders,
    overallStatus,
    items: orders.flatMap((order) => order.items),
    totalOriginalPrice: sum("totalOriginalPrice"),
    totalDiscount: sum("totalDiscount"),
    finalTotalPrice: sum("finalTotalPrice"),
    totalQuantity: sum("totalQuantity"),
  }
}
