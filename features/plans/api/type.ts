export type BillingInterval = "monthly" | "halfYearly" | "yearly"

/** Ascending by length — the UI toggle and savings copy rely on this order. */
export const BILLING_INTERVALS: BillingInterval[] = [
  "monthly",
  "halfYearly",
  "yearly",
]

export const INTERVAL_MONTHS: Record<BillingInterval, number> = {
  monthly: 1,
  halfYearly: 6,
  yearly: 12,
}

/** Prices are integer EGP cents. null means the interval is not sold. */
export interface PlanPrices {
  monthly: number | null
  halfYearly: number | null
  yearly: number | null
}

export interface Plan {
  /** Immutable once created — restaurants and payments reference it. */
  slug: string
  label: string
  /** null means unlimited. */
  productCap: number | null
  prices: PlanPrices
  sortOrder: number
  /** Hidden from new buyers; existing holders keep it to the period end. */
  archived: boolean
  /** Exactly one plan carries this; a trial borrows its capacity. */
  isTrialPlan: boolean
  /** Restaurants currently on this plan — shown before archiving or deleting. */
  holderCount: number
}

export type PlanCreate = Pick<
  Plan,
  "slug" | "label" | "productCap" | "prices"
> &
  Partial<Pick<Plan, "sortOrder" | "isTrialPlan">>

export type PlanUpdate = Partial<Omit<PlanCreate, "slug">>

/** Cents to whole EGP, for display. */
export function toEGP(cents: number | null): number | null {
  return cents === null ? null : cents / 100
}

/** Whole EGP to cents, for submission. Prices are never stored as floats. */
export function toCents(egp: number | null): number | null {
  return egp === null ? null : Math.round(egp * 100)
}

/**
 * Mirrors the backend ladder guard so the admin form can warn before
 * submitting. The server rejects a bad ladder regardless — this only saves a
 * round trip.
 */
export function ladderViolation(prices: PlanPrices): BillingInterval | null {
  let previousPerMonth = Number.POSITIVE_INFINITY

  for (const interval of BILLING_INTERVALS) {
    const price = prices[interval]
    if (price === null) continue

    const perMonth = price / INTERVAL_MONTHS[interval]
    if (perMonth > previousPerMonth) return interval
    previousPerMonth = perMonth
  }

  return null
}
