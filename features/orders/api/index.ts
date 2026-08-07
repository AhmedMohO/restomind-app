import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  CreateOrderPayload,
  ApiOrderGroup,
  ApiRestaurantOrder,
  OrderStatus,
  PaginatedResponse,
  QueryOrderListingParams,
  GetChildOrderByIdResponse,
  UpdateOrderStatusResponse,
} from "./type"

export * from "./type"

/** Query parameters accepted by `GET /orders`. */
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
): Promise<{ data: ApiOrderGroup | ApiOrderGroup[]; checkoutUrl?: string }> {
  const response = await apiClient("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  // `checkoutUrl` is present only for online payment methods — the API omits
  // it entirely for Cash on Delivery.
  return parseOrThrow<{
    data: ApiOrderGroup | ApiOrderGroup[]
    checkoutUrl?: string
  }>(response, "createOrder")
}

/** GET /orders — paginated customer order history (customer only). */
export async function getMyOrders(
  params: MyOrdersParams = {}
): Promise<PaginatedResponse<ApiOrderGroup>> {
  const response = await apiClient(`/orders${buildQueryString(params)}`)
  return parseOrThrow<PaginatedResponse<ApiOrderGroup>>(response, "getMyOrders")
}

/**
 * Every page of `GET /orders`.
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

/** GET /orders/group/:id — customer order group details (customer/admin). */
export async function getMyOrderById(
  groupOrderId: string
): Promise<{ data: ApiOrderGroup }> {
  const response = await apiClient(`/orders/group/${encodeURIComponent(groupOrderId)}`)
  return parseOrThrow<{ data: ApiOrderGroup }>(response, "getMyOrderById")
}

/** GET /orders — platform-wide order listing (admin only). */
export async function getAllOrders(
  params: QueryOrderListingParams = {}
): Promise<PaginatedResponse<ApiOrderGroup>> {
  const response = await apiClient(`/orders${buildQueryString(params)}`)
  return parseOrThrow<PaginatedResponse<ApiOrderGroup>>(response, "getAllOrders")
}

/**
 * GET /orders — sub-orders of a single restaurant (admin, manager, staff).
 * Managers and staff automatically retrieve sub-orders belonging to their assigned restaurant.
 */
export async function getRestaurantOrders(
  restaurantId: string,
  params: QueryOrderListingParams = {}
): Promise<PaginatedResponse<ApiRestaurantOrder>> {
  const response = await apiClient(
    `/orders${buildQueryString({ ...params, restaurantId })}`
  )
  return parseOrThrow<PaginatedResponse<ApiRestaurantOrder>>(
    response,
    "getRestaurantOrders"
  )
}

/** GET /orders/group/:id — order group details (admin/customer). */
export async function getOrderGroupById(
  groupOrderId: string
): Promise<{ data: ApiOrderGroup }> {
  const response = await apiClient(`/orders/group/${encodeURIComponent(groupOrderId)}`)
  return parseOrThrow<{ data: ApiOrderGroup }>(response, "getOrderGroupById")
}

/** GET /orders/:id — child order details (customer/manager/admin). */
export async function getChildOrderById(
  id: string
): Promise<GetChildOrderByIdResponse> {
  const response = await apiClient(`/orders/${encodeURIComponent(id)}`)
  return parseOrThrow<GetChildOrderByIdResponse>(response, "getChildOrderById")
}

/** PATCH /orders/group/:id/cancel — cancel order group (customer only). */
export async function cancelOrderGroup(
  groupOrderId: string
): Promise<{ data: ApiOrderGroup }> {
  const response = await apiClient(
    `/orders/group/${encodeURIComponent(groupOrderId)}/cancel`,
    {
      method: "PATCH",
    }
  )
  return parseOrThrow<{ data: ApiOrderGroup }>(response, "cancelOrderGroup")
}

/**
 * PATCH /orders/:id/status — update a child order status (admin/manager).
 * Managers may only touch orders of their own restaurant (enforced upstream).
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<UpdateOrderStatusResponse> {
  const response = await apiClient(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<UpdateOrderStatusResponse>(response, "updateOrderStatus")
}

