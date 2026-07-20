import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { ApiOrder, OrderStatus } from "./type"

export * from "./type"

/** POST /orders — create order from active cart (customer only) */
export async function createOrder(): Promise<{ data: ApiOrder }> {
  const response = await apiClient("/orders", {
    method: "POST",
    body: JSON.stringify({}),
  })
  return parseOrThrow<{ data: ApiOrder }>(response, "createOrder")
}

/** GET /orders/me — get customer order history (customer only) */
export async function getMyOrders(): Promise<{ data: ApiOrder[] }> {
  const response = await apiClient("/orders/me")
  return parseOrThrow<{ data: ApiOrder[] }>(response, "getMyOrders")
}

/** GET /orders/me/:id — get customer order details (customer only) */
export async function getMyOrderById(id: string): Promise<{ data: ApiOrder }> {
  const response = await apiClient(`/orders/me/${id}`)
  return parseOrThrow<{ data: ApiOrder }>(response, "getMyOrderById")
}

/** GET /orders — get all orders (admin only) */
export async function getAllOrders(): Promise<{ data: ApiOrder[] }> {
  const response = await apiClient("/orders")
  return parseOrThrow<{ data: ApiOrder[] }>(response, "getAllOrders")
}

/** PATCH /orders/:id/status — update order status (admin only) */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<{ data: ApiOrder }> {
  const response = await apiClient(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<{ data: ApiOrder }>(response, "updateOrderStatus")
}
