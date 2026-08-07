import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type {
  BillingInterval,
  MySubscription,
  PaymentMethod,
  PlanSlug,
} from "./type"

export * from "./type"

/** GET /subscriptions/me — billing state for the caller's restaurant */
export async function getMySubscription(): Promise<MySubscription> {
  const response = await apiClient("/subscriptions/me")
  return parseOrThrow<MySubscription>(response, "getMySubscription")
}

/** POST /subscriptions/checkout — returns a Paymob Unified Checkout URL */
export async function startSubscriptionCheckout(
  tier: PlanSlug,
  interval: BillingInterval,
  method: PaymentMethod
): Promise<{ checkoutUrl: string }> {
  const response = await apiClient("/subscriptions/checkout", {
    method: "POST",
    body: JSON.stringify({ tier, interval, method }),
    headers: { "Content-Type": "application/json" },
  })
  return parseOrThrow<{ checkoutUrl: string }>(
    response,
    "startSubscriptionCheckout"
  )
}

/** GET /payments/methods — enabled methods, never a hardcoded list */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await apiClient("/payments/methods")
  const body = await parseOrThrow<{ data: PaymentMethod[] }>(
    response,
    "getPaymentMethods"
  )
  return body.data
}
