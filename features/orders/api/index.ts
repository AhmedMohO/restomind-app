import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { ApiOrderGroup, ApiRestaurantOrder, OrderStatus } from "./type"

export * from "./type"

/** POST /orders — create order from active cart (customer only) */
export async function createOrder(): Promise<{ data: ApiOrderGroup }> {
  const response = await apiClient("/orders", {
    method: "POST",
    body: JSON.stringify({}),
  })
  return parseOrThrow<{ data: ApiOrderGroup }>(response, "createOrder")
}

/** GET /orders/me — get customer order history (customer only) */
export async function getMyOrders(): Promise<{ data: ApiOrderGroup[] }> {
  const response = await apiClient("/orders/me")
  return parseOrThrow<{ data: ApiOrderGroup[] }>(response, "getMyOrders")
}

/** GET /orders/me/:id — get customer order details (customer only) */
export async function getMyOrderById(
  orderGroupId: string
): Promise<{ data: ApiOrderGroup }> {
  const response = await apiClient(`/orders/me/${orderGroupId}`)
  return parseOrThrow<{ data: ApiOrderGroup }>(response, "getMyOrderById")
}

/** GET /orders — get all orders (admin only) */
export async function getAllOrders(): Promise<{ data: ApiOrderGroup[] }> {
  const response = await apiClient("/orders")
  return parseOrThrow<{ data: ApiOrderGroup[] }>(response, "getAllOrders")
}

/** PATCH /orders/:id/status — update order status (admin only) */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<{ data: ApiRestaurantOrder }> {
  const response = await apiClient(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<{ data: ApiRestaurantOrder }>(
    response,
    "updateOrderStatus"
  )
}
