import { headers } from "next/headers"

import {
  getMySubscription,
  getPaymentMethods,
  hasDashboardAccess,
} from "../api"
import BillingWall from "./BillingWall"
import SubscriptionBanner from "./SubscriptionBanner"

/**
 * Resolves subscription state once for the entire dashboard.
 *
 * Placing this in the layout means every dashboard page — present and future —
 * is covered with no per-page work.
 *
 * Routes that stay reachable while locked:
 *  - /dashboard/billing, or the merchant could never pay their way out.
 *  - /dashboard/orders, because a lapsed merchant may still have paid,
 *    undelivered orders in flight. Locking fulfilment would strand customers
 *    who already handed over money — the wrong party to punish. Offer
 *    suspension already stops new orders arriving.
 *  - /dashboard/refunds, for the same reason: a customer's right to their
 *    money back is not conditional on the merchant paying their own invoice.
 *    This mirrors the backend, where the refund routes use plain @Auth.
 */
const ALWAYS_ALLOWED = [
  "/dashboard/billing",
  "/dashboard/orders",
  "/dashboard/refunds",
]

export default async function SubscriptionGate({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: string
}) {
  let subscription
  try {
    subscription = await getMySubscription()
  } catch {
    // An admin has no restaurant and therefore no subscription; the same is
    // true if billing is unreachable. Failing open here is correct — the
    // backend guard is the real enforcement point, and locking the whole
    // dashboard because one endpoint hiccuped would be worse than the risk.
    return <>{children}</>
  }

  if (hasDashboardAccess(subscription.state)) {
    return (
      <>
        <SubscriptionBanner subscription={subscription} locale={locale} />
        {children}
      </>
    )
  }

  // Set by proxy.ts. Children are never rendered when locked, so their data
  // fetches (which would 402 anyway) never run.
  const pathname = (await headers()).get("x-pathname") ?? ""
  const onAllowedRoute = ALWAYS_ALLOWED.some((allowed) =>
    pathname.includes(allowed)
  )

  if (onAllowedRoute) return <>{children}</>

  const methods = await getPaymentMethods().catch(
    () => ["card"] as ("card" | "wallet")[]
  )

  return <BillingWall subscription={subscription} methods={methods} />
}
