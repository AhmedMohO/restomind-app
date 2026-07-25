import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import {
  normalizeOrderGroup,
  normalizeRestaurantOrder,
} from "../normalize"
import type {
  CreateOrderPayload,
  ApiOrderGroup,
  ApiRestaurantOrder,
  OrderStatus,
  PaginatedResponse,
  QueryOrderListingParams,
} from "./type"

export * from "./type"

/** Applies `map` to a paginated payload while preserving its meta fields. */
function mapPage<TIn, TOut>(
  page: PaginatedResponse<TIn>,
  map: (item: TIn) => TOut
): PaginatedResponse<TOut> {
  return { ...page, data: (page.data ?? []).map(map) }
}

/** Query parameters accepted by `GET /orders/me` (API docs §9.2). */
export interface MyOrdersParams {
  page?: number
  limit?: number
  status?: OrderStatus
  restaurantId?: string
}

const MY_ORDERS_PAGE_SIZE = 50

/**
 * POST /orders — create an order from the active cart (customer only).
 * Returns the aggregated group order (or one per restaurant).
 */
export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ data: ApiOrderGroup | ApiOrderGroup[] }> {
  const response = await apiClient("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const body = await parseOrThrow<{ data: unknown }>(response, "createOrder")
  return {
    data: Array.isArray(body.data)
      ? body.data.map(normalizeOrderGroup)
      : normalizeOrderGroup(body.data),
  }
}

/** GET /orders/me — paginated customer order history (customer only). */
export async function getMyOrders(
  params: MyOrdersParams = {}
): Promise<PaginatedResponse<ApiOrderGroup>> {
  const response = await apiClient(`/orders/me${buildQueryString(params)}`)
  const page = await parseOrThrow<PaginatedResponse<unknown>>(response, "getMyOrders")
  return mapPage(page, normalizeOrderGroup)
}

/**
 * Every page of `GET /orders/me`.
 *
 * The order history screen filters, sorts and paginates client-side (the
 * endpoint exposes none of those knobs beyond `status`), so it needs the full
 * history rather than the first page. Remaining pages are fetched in parallel.
 */
export async function getAllMyOrders(): Promise<ApiOrderGroup[]> {
  const first = await getMyOrders({ page: 1, limit: MY_ORDERS_PAGE_SIZE })
  if (first.totalPages <= 1) return first.data

  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      getMyOrders({ page: index + 2, limit: MY_ORDERS_PAGE_SIZE })
    )
  )
  return [first.data, ...rest.map((page) => page.data)].flat()
}

/** GET /orders/me/:id — customer order group details (customer only). */
export async function getMyOrderById(
  orderGroupId: string
): Promise<{ data: ApiOrderGroup }> {
  const response = await apiClient(`/orders/me/${encodeURIComponent(orderGroupId)}`)
  const body = await parseOrThrow<{ data: unknown }>(response, "getMyOrderById")
  return { data: normalizeOrderGroup(body.data) }
}

/** GET /orders — platform-wide order listing (admin only). */
export async function getAllOrders(
  params: QueryOrderListingParams = {}
): Promise<PaginatedResponse<ApiOrderGroup>> {
  const response = await apiClient(`/orders${buildQueryString(params)}`)
  const page = await parseOrThrow<PaginatedResponse<unknown>>(response, "getAllOrders")
  return mapPage(page, normalizeOrderGroup)
}

/**
 * GET /orders/restaurant/:restaurantId — sub-orders of a single restaurant
 * (admin, manager, staff). Managers and staff may only pass their own
 * `restaurantId`; the backend enforces it.
 */
export async function getRestaurantOrders(
  restaurantId: string,
  params: QueryOrderListingParams = {}
): Promise<PaginatedResponse<ApiRestaurantOrder>> {
  const response = await apiClient(
    `/orders/restaurant/${encodeURIComponent(restaurantId)}${buildQueryString(params)}`
  )
  const page = await parseOrThrow<PaginatedResponse<unknown>>(
    response,
    "getRestaurantOrders"
  )
  return mapPage(page, (order) => normalizeRestaurantOrder(order))
}

/** GET /orders/group/:id — order group details (admin/customer/manager). */
export async function getOrderGroupById(
  orderGroupId: string
): Promise<{ data: ApiOrderGroup }> {
  const response = await apiClient(`/orders/group/${encodeURIComponent(orderGroupId)}`)
  const body = await parseOrThrow<{ data: unknown }>(response, "getOrderGroupById")
  return { data: normalizeOrderGroup(body.data) }
}

/**
 * PATCH /orders/:id/status — update a sub-order status (admin/manager).
 * Managers may only touch orders of their own restaurant (enforced upstream).
 */
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
