/**
 * Merchant settlement types.
 *
 * Every amount is an integer number of piasters, exactly as the API stores it.
 * Nothing here converts to EGP — the components do that at render time, so a
 * rounding mistake can never make it back into a total.
 */

export type LedgerLineKind = "sale" | "refund" | "adjustment"

/** One signed movement in a merchant's favour or against it. */
export interface LedgerLine {
  kind: LedgerLineKind
  /** Order, Refund or MerchantAdjustment id. */
  ref: string
  restaurantId: string
  occurredAt: string
  /** What RestoMind collected from the customer. Zero for cash on delivery. */
  grossCents: number
  /** Positive when RestoMind earns it, negative when it is reversed. */
  commissionCents: number
  /** Positive: RestoMind owes the merchant. Negative: the merchant owes us. */
  merchantNetCents: number
  note?: string
}

export interface StatementTotals {
  grossCents: number
  commissionCents: number
  /** Commission excluding VAT — what RestoMind actually keeps. */
  commissionNetCents: number
  commissionVatCents: number
  /** The only figure that decides what gets transferred. */
  merchantNetCents: number
}

/**
 * What ops should do with a statement.
 *
 * `blocked` means the merchant has no payout destination on file. It is not an
 * error state a merchant can fix themselves — support sets the bank details.
 */
export type PayoutDecision =
  | { action: "pay"; direction: "to_merchant" }
  | { action: "collect"; direction: "from_merchant" }
  | { action: "carry"; reason: "below_minimum" }
  | { action: "blocked"; reason: "no_payout_destination" }

export interface StatementException {
  kind: "delivered_unpaid" | "paid_undelivered" | "refund_stuck"
  ref: string
  amountCents: number
  detail: string
}

export interface PayoutStatement {
  restaurantId: string
  restaurantName: string
  periodStart: string
  periodEnd: string
  lines: LedgerLine[]
  totals: StatementTotals
  decision: PayoutDecision
  exceptions: StatementException[]
}

export type PayoutStatus = "pending" | "completed" | "failed"
export type PayoutDirection = "to_merchant" | "from_merchant"

/** A settlement that actually happened. Immutable once completed. */
export interface Payout {
  _id: string
  restaurantId: string
  periodStart: string
  periodEnd: string
  /** Always positive; `direction` carries the sign. */
  amountCents: number
  direction: PayoutDirection
  lines: LedgerLine[]
  commissionNetCents: number
  commissionVatCents: number
  reference?: string
  status: PayoutStatus
  completedAt?: string
  failureReason?: string
  createdAt: string
}

export interface RecordPayoutPayload {
  /** Cairo calendar date, exclusive end of the period being settled. */
  cutoffDate: string
  /**
   * Re-entered deliberately and checked against the statement server-side: it
   * catches the case where the statement moved between being read and paid.
   */
  amountCents: number
  reference?: string
}

export interface CompletePayoutPayload {
  reference?: string
  /** Present means the transfer bounced; the payout is marked failed. */
  failureReason?: string
}

export interface CreateAdjustmentPayload {
  /** Signed piasters. Positive credits the merchant, negative debits them. */
  amountCents: number
  reason: string
  /** YYYY-MM-DD. Omit for today. Cannot be dated into a settled period. */
  effectiveAt?: string
}

/** Piasters to EGP. The one place the conversion happens. */
export function toEgp(cents: number): number {
  return cents / 100
}
