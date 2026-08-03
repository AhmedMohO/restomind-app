/**
 * Role-aware order access for the dashboard (server-only).
 *
 * A single place decides *which* upstream endpoint a dashboard user may reach:
 *
 *   admin            → the whole platform (`/orders`, `/orders/group/:id`)
 *   manager / staff  → their own restaurant only (`/orders/:id`)
 *
 * Route handlers stay thin and can never accidentally widen a manager's or a
 * staff member's scope, because the restaurant id always comes from the session
 * rather than from the request.
 */

import "server-only"

import { AuthorizationError } from "@/lib/auth/errors"
import type { SessionUser } from "@/features/auth/auth"
import { getAllOrders, getChildOrderById, getOrderGroupById, getRestaurantOrders } from "./index"
import type {
  ApiChildOrder,
  ApiGroupSubOrder,
  ApiOrderGroup,
  OrderStatus,
  OverallOrderStatus,
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
 * Child order details for manager or admin using `GET /orders/:id`.
 * Returns `ApiChildOrder` directly without mapping.
 */
export async function getDashboardChildOrder(
  user: SessionUser,
  id: string
): Promise<ApiChildOrder> {
  const { data } = await getChildOrderById(id)

  if (isAdmin(user)) return data

  const restaurantId = ownRestaurantId(user)
  if (data.restaurant?._id && data.restaurant._id !== restaurantId) {
    throw new AuthorizationError("This order does not belong to your restaurant")
  }

  return data
}

/**
 * Group order details for an admin using `GET /orders/group/:id`.
 */
export async function getDashboardOrderGroup(
  user: SessionUser,
  id: string
): Promise<ApiOrderGroup> {
  const { data: group } = await getOrderGroupById(id)
  return group
}

