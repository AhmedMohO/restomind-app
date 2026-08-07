export type RefundStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "processing"
  | "succeeded"
  | "failed"
  | "manual_required"

export type RefundSettlementMode = "gateway" | "offline"

export interface ApiRefund {
  _id: string
  paymentId?: string
  orderGroupId: string | { _id: string; [key: string]: unknown }
  orderId?: string | { _id: string; [key: string]: unknown }
  lineItemIndexes?: number[]
  amountCents: number
  reason: string
  settlementMode: RefundSettlementMode
  status: RefundStatus
  initiatedBy: string | { _id: string; fullName?: string; emailAddress?: string; [key: string]: unknown }
  reviewedBy?: string | { _id: string; fullName?: string; emailAddress?: string; [key: string]: unknown }
  reviewedAt?: string
  rejectionReason?: string
  gatewayOperation?: "refund" | "void"
  gatewayError?: string
  completedAt?: string
  createdAt: string
}

export interface CreateRefundPayload {
  /** Omit to refund the whole group. */
  orderId?: string
  /** Omit to refund the whole order. */
  lineItemIndexes?: number[]
  reason: string
}

/** Piasters to a display string. Amounts are integers server-side. */
export function formatRefundAmount(amountCents: number): string {
  return (amountCents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Statuses that still need someone to act.
 *
 * `manual_required` is included deliberately: the gateway refused (a wallet
 * that cannot be refunded, or a payment with no settled transaction) and a
 * human has to settle it offline. Hiding it would lose the customer's money
 * in the UI.
 */
export function needsAttention(status: RefundStatus): boolean {
  return (
    status === "requested" ||
    status === "manual_required" ||
    status === "processing" ||
    status === "failed"
  )
}
