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

export {
  toEGP,
  toCents,
  ladderViolation,
} from "../utils"

