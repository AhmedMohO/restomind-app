"use server"

import { apiClient } from "@/lib/api/client"

/**
 * Asks the server to settle a payment immediately on return from Paymob.
 *
 * The gateway's callback is the authority, but it is not always prompt — and
 * against a localhost API it never arrives at all, because Paymob cannot reach
 * a private address. Without this nudge the payer waits up to twenty minutes
 * for the reconciliation sweep while being told they still owe money.
 *
 * The `order` query parameter Paymob appends to the return URL is the only
 * input, and it is untrusted: the server verifies the payment belongs to the
 * caller and re-reads the outcome from Paymob rather than believing the URL.
 * Failure is deliberately silent — the pages that call this poll for the real
 * status anyway, so a failed nudge costs latency, not correctness.
 */
export type PaymentStatus = "pending" | "paid" | "failed" | "expired"

export async function reconcilePaymentAction(
  paymobOrderId: string | null
): Promise<PaymentStatus | null> {
  if (!paymobOrderId || !/^\d+$/.test(paymobOrderId)) return null

  try {
    const response = await apiClient(
      `/payments/reconcile/${paymobOrderId}`,
      { method: "POST" }
    )
    if (!response.ok) return null
    const body = (await response.json()) as { status?: PaymentStatus }
    return body.status ?? null
  } catch (error) {
    console.error("[reconcilePaymentAction]", error)
    return null
  }
}
