export type SubscriptionState =
  | "trial"
  | "active"
  | "grace"
  | "expired"
  | "unpaid"

export type TierName = "basic" | "plus" | "scale"

export interface TierOption {
  name: TierName
  label: string
  /** null means unlimited. */
  productCap: number | null
  /** VAT-inclusive monthly price in EGP. */
  priceEGP: number
  netEGP: number
  vatEGP: number
  /** True when the restaurant's current catalogue fits inside this tier. */
  fitsCurrentCatalogue: boolean
  /**
   * False while the merchant already holds this much capacity, paid or on
   * trial. Mirrors the backend guard exactly, so the screen never offers a
   * button the next request would reject with 409.
   */
  purchasable: boolean
}

export interface MySubscription {
  state: SubscriptionState
  tier: TierName | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  /**
   * When a month bought right now would begin. Computed by the same backend
   * rule that writes the period, so the screen cannot promise a date the
   * ledger will contradict: buying during a trial starts after the trial,
   * renewing early starts after the current month.
   */
  nextPeriodStart: string
  /**
   * When the plans they already hold become buyable again, or null when
   * nothing is blocked. Renewal is meant to happen at the end of a period,
   * not stacked on top of one.
   */
  renewableFrom: string | null
  productCount: number
  /** null means unlimited. */
  productCap: number | null
  tiers: TierOption[]
}

export type PaymentMethod = "card" | "wallet"

/** States in which the dashboard is fully usable. Mirrors the backend. */
export function hasDashboardAccess(state: SubscriptionState): boolean {
  return state === "trial" || state === "active" || state === "grace"
}

/** Whole days from now until an ISO date, on calendar-day boundaries. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return null
  const msPerDay = 86_400_000
  return Math.ceil((target.getTime() - Date.now()) / msPerDay)
}
