import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  ApiPurchaseOrder,
  CreatePurchaseOrderInput,
  GetPurchaseOrdersParams,
  PaginatedPurchaseOrders,
  PurchaseOrderStatus,
} from "../types"

export * from "../types"

/** GET /purchase-orders — paginated & filtered list for manager */
export async function getPurchaseOrders(
  params: GetPurchaseOrdersParams = {}
): Promise<PaginatedPurchaseOrders> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/purchase-orders${qs}`)
  return parseOrThrow<PaginatedPurchaseOrders>(response, "getPurchaseOrders")
}

/** POST /purchase-orders — create a purchase order */
export async function createPurchaseOrder(
  data: CreatePurchaseOrderInput
): Promise<{ data: ApiPurchaseOrder }> {
  const response = await apiClient("/purchase-orders", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return parseOrThrow<{ data: ApiPurchaseOrder }>(response, "createPurchaseOrder")
}

/** PATCH /purchase-orders/:id/receive — mark purchase order as received */
export async function receivePurchaseOrder(
  id: string
): Promise<{ message: string; data: ApiPurchaseOrder }> {
  const response = await apiClient(`/purchase-orders/${id}/receive`, {
    method: "PATCH",
  })
  return parseOrThrow<{ message: string; data: ApiPurchaseOrder }>(
    response,
    "receivePurchaseOrder"
  )
}

/** PATCH /purchase-orders/:id/status — update purchase order status */
export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<{ message: string; data: ApiPurchaseOrder }> {
  const response = await apiClient(`/purchase-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  return parseOrThrow<{ message: string; data: ApiPurchaseOrder }>(
    response,
    "updatePurchaseOrderStatus"
  )
}
