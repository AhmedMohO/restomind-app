import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  CompletePayoutPayload,
  CreateAdjustmentPayload,
  Payout,
  PayoutStatement,
  RecordPayoutPayload,
} from "./type"

export * from "./type"

/**
 * GET /payouts/statement — the caller's OWN statement.
 *
 * Scoped server-side to the token's restaurant, never a parameter, so a
 * merchant cannot read a competitor's balance by changing a URL.
 */
export async function getMyStatement(
  cutoffDate?: string
): Promise<PayoutStatement> {
  const qs = buildQueryString({ cutoffDate })
  const response = await apiClient(`/payouts/statement${qs}`)
  return parseOrThrow<PayoutStatement>(response, "getMyStatement")
}

/** GET /payouts/statement/:restaurantId — any merchant's statement (admin). */
export async function getStatementFor(
  restaurantId: string,
  cutoffDate?: string
): Promise<PayoutStatement> {
  const qs = buildQueryString({ cutoffDate })
  const response = await apiClient(`/payouts/statement/${restaurantId}${qs}`)
  return parseOrThrow<PayoutStatement>(response, "getStatementFor")
}

/** GET /payouts/history — settlements already made to the caller. */
export async function getMyPayoutHistory(): Promise<Payout[]> {
  const response = await apiClient("/payouts/history")
  return parseOrThrow<Payout[]>(response, "getMyPayoutHistory")
}

/** GET /payouts/history/:restaurantId — one merchant's settlements (admin). */
export async function getPayoutHistoryFor(
  restaurantId: string
): Promise<Payout[]> {
  const response = await apiClient(`/payouts/history/${restaurantId}`)
  return parseOrThrow<Payout[]>(response, "getPayoutHistoryFor")
}

/** POST /payouts/:restaurantId — record a transfer as pending (admin). */
export async function recordPayout(
  restaurantId: string,
  payload: RecordPayoutPayload
): Promise<Payout> {
  const response = await apiClient(`/payouts/${restaurantId}`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<Payout>(response, "recordPayout")
}

/**
 * PATCH /payouts/:payoutId/complete — confirm or fail a recorded transfer.
 *
 * Only a landed transfer advances the merchant's paid-through mark, which is
 * why this is a second step rather than part of recording.
 */
export async function completePayout(
  payoutId: string,
  payload: CompletePayoutPayload
): Promise<Payout> {
  const response = await apiClient(`/payouts/${payoutId}/complete`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<Payout>(response, "completePayout")
}

/** POST /payouts/:restaurantId/adjustments — signed correction (admin). */
export async function createAdjustment(
  restaurantId: string,
  payload: CreateAdjustmentPayload
): Promise<unknown> {
  const response = await apiClient(`/payouts/${restaurantId}/adjustments`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<unknown>(response, "createAdjustment")
}
