"use server"

import {
  getMySubscription,
  getPaymentMethods,
  startSubscriptionCheckout,
  type MySubscription,
  type PaymentMethod,
  type TierName,
} from "./api"

/**
 * Server Action: begin a subscription payment.
 *
 * Returns the Paymob Unified Checkout URL for the client to redirect to.
 * Errors are returned rather than thrown so the billing wall can show a
 * readable message instead of an error boundary — a merchant who cannot pay
 * is the one user who must never hit a blank screen.
 */
export async function startCheckoutAction(
  tier: TierName,
  method: PaymentMethod
): Promise<{ checkoutUrl: string } | { error: string }> {
  try {
    return await startSubscriptionCheckout(tier, method)
  } catch (error) {
    console.error("[startCheckoutAction]", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not start checkout. Please try again.",
    }
  }
}

/** Server Action: re-read subscription state (used after returning from Paymob). */
export async function fetchMySubscriptionAction(): Promise<MySubscription | null> {
  try {
    return await getMySubscription()
  } catch (error) {
    console.error("[fetchMySubscriptionAction]", error)
    return null
  }
}

/** Server Action: enabled payment methods. */
export async function fetchPaymentMethodsAction(): Promise<PaymentMethod[]> {
  try {
    return await getPaymentMethods()
  } catch (error) {
    console.error("[fetchPaymentMethodsAction]", error)
    // Card is the always-configured method; degrading to it beats showing an
    // empty picker that makes payment look impossible.
    return ["card"]
  }
}
