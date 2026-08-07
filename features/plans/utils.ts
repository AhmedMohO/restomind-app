import {
  BILLING_INTERVALS,
  INTERVAL_MONTHS,
  type BillingInterval,
  type PlanPrices,
} from "./api/type"

export type PriceDraft = Record<BillingInterval, string>

export const EMPTY_PRICES: PriceDraft = {
  monthly: "",
  halfYearly: "",
  yearly: "",
}

/** Cents to whole EGP, for display. */
export function toEGP(cents: number | null): number | null {
  return cents === null ? null : cents / 100
}

/** Whole EGP to cents, for submission. Prices are never stored as floats. */
export function toCents(egp: number | null): number | null {
  return egp === null ? null : Math.round(egp * 100)
}

/** Cents to a display string in whole EGP, or an em dash when not sold. */
export function price(cents: number | null): string {
  return cents === null ? "—" : (cents / 100).toLocaleString()
}

/** Converts backend prices to draft strings for form inputs. */
export function toDraft(prices: PlanPrices): PriceDraft {
  return {
    monthly: prices.monthly === null ? "" : String(prices.monthly / 100),
    halfYearly:
      prices.halfYearly === null ? "" : String(prices.halfYearly / 100),
    yearly: prices.yearly === null ? "" : String(prices.yearly / 100),
  }
}

/** An empty field means "not sold", which is null — never 0. */
export function draftToPrices(draft: PriceDraft): PlanPrices {
  const parse = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === "") return null
    const value = Number(trimmed)
    return Number.isFinite(value) && value >= 0 ? toCents(value) : null
  }

  return {
    monthly: parse(draft.monthly),
    halfYearly: parse(draft.halfYearly),
    yearly: parse(draft.yearly),
  }
}

/**
 * Mirrors the backend ladder guard so the admin form can warn before
 * submitting. The server rejects a bad ladder regardless — this only saves a
 * round trip.
 */
export function ladderViolation(prices: PlanPrices): BillingInterval | null {
  let previousTotal = -1
  let previousPerMonth = Number.POSITIVE_INFINITY

  for (const interval of BILLING_INTERVALS) {
    const price = prices[interval]
    if (price === null) continue

    const perMonth = price / INTERVAL_MONTHS[interval]
    if (price <= previousTotal || perMonth > previousPerMonth) return interval

    previousTotal = price
    previousPerMonth = perMonth
  }

  return null
}

/** Calculate percentage savings relative to the monthly base rate. */
export function getSavingsPercent(
  interval: BillingInterval,
  prices: Record<BillingInterval, number | null>
): number | null {
  if (interval === "monthly") return null
  const monthlyCents = prices.monthly
  const currentCents = prices[interval]
  if (!monthlyCents || !currentCents) return null

  const monthlyRate = monthlyCents / 100
  const currentRate = currentCents / 100 / INTERVAL_MONTHS[interval]

  if (currentRate >= monthlyRate) return null
  return Math.round(((monthlyRate - currentRate) / monthlyRate) * 100)
}
