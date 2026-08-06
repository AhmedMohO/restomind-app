export type SubscriptionState =
  | "trial"
  | "active"
  | "grace"
  | "expired"
  | "unpaid"

import type { BillingInterval } from "@/features/plans/api/type"

export type { BillingInterval }

/** A plan slug. Open-ended now that plans are admin-managed. */
export type PlanSlug = string

export interface IntervalOption {
  /** VAT-inclusive price in EGP — what this merchant actually pays. */
  priceEGP: number
  /**
   * The price without the early-bird seat, for showing the saving. Null when
   * the merchant is not on early-bird pricing, so there is nothing to compare
   * against and nothing to strike through.
   */
  standardPriceEGP: number | null
  netEGP: number
  vatEGP: number
  /** The per-month equivalent, so intervals can be compared like for like. */
  perMonthEGP: number
  /**
   * Saving against paying monthly. Null when monthly is not sold, so there is
   * no baseline to claim a saving against.
   */
  savingPercent: number | null
  /**
   * False while the merchant already holds this much capacity on this or a
   * longer commitment. Mirrors the backend guard exactly, so the screen never
   * offers a button the next request would reject with 409.
   */
  purchasable: boolean
  /** Why it is locked, with the date it frees up. Null when purchasable. */
  blockedReason: string | null
}

export interface PlanOption {
  slug: PlanSlug
  label: string
  /** null means unlimited. */
  productCap: number | null
  /** The plan this merchant is currently on. */
  isCurrent: boolean
  /** True when the restaurant's current catalogue fits inside this plan. */
  fitsCurrentCatalogue: boolean
  /** null for an interval this plan does not sell. */
  intervals: Record<BillingInterval, IntervalOption | null>
}

export interface MySubscription {
  state: SubscriptionState
  /**
   * Whether early-bird pricing is being applied right now. False when the
   * merchant holds no seat, and also when the platform switch has been turned
   * off — in which case they keep the seat but renew at the standard price.
   */
  earlyBird: boolean
  /** The plan slug currently held, or null. */
  tier: PlanSlug | null
  /** The commitment length currently held, or null on a trial. */
  interval: BillingInterval | null
  /**
   * The label of the plan they hold, snapshotted at purchase — so an archived
   * or renamed plan still displays as what they actually bought.
   */
  planLabel: string | null
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
  plans: PlanOption[]
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
