import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { ApiRefund, CreateRefundPayload } from "./type"

export * from "./type"

/** GET /orders/refunds — refunds visible to the caller's role. */
export async function getRefunds(): Promise<{ data: ApiRefund[] }> {
  const response = await apiClient("/orders/refunds")
  return parseOrThrow<{ data: ApiRefund[] }>(response, "getRefunds")
}

/** POST /orders/group/:groupId/refunds — request or issue a refund. */
export async function createRefund(
  groupId: string,
  payload: CreateRefundPayload
): Promise<{ data: ApiRefund; message?: string }> {
  const response = await apiClient(`/orders/group/${groupId}/refunds`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<{ data: ApiRefund; message?: string }>(
    response,
    "createRefund"
  )
}

/** PATCH /orders/refunds/:refundId/review — approve or reject a request. */
export async function reviewRefund(
  refundId: string,
  decision: "approve" | "reject" | "settle",
  rejectionReason?: string
): Promise<{ message: string; status?: string }> {
  const response = await apiClient(`/orders/refunds/${refundId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ decision, rejectionReason }),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<{ message: string; status?: string }>(
    response,
    "reviewRefund"
  )
}
