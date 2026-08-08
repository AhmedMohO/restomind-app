"use server"

import { revalidatePath } from "next/cache"

import {
  completePayout,
  createAdjustment,
  getMyPayoutHistory,
  getMyStatement,
  getPayoutHistoryFor,
  getStatementFor,
  recordPayout,
  type CompletePayoutPayload,
  type CreateAdjustmentPayload,
  type Payout,
  type PayoutStatement,
  type RecordPayoutPayload,
} from "./api"
import { extractApiMessage } from "@/lib/api/utils"

export type PayoutActionResult =
  | { success: true; message: string }
  | { success: false; message: string }

/** Merchant: read own live statement. */
export async function fetchMyStatementAction(
  cutoffDate?: string
): Promise<PayoutStatement | null> {
  try {
    return await getMyStatement(cutoffDate)
  } catch (error) {
    console.error("[fetchMyStatementAction]", error)
    return null
  }
}

/** Merchant: read own settlements history. */
export async function fetchMyPayoutHistoryAction(): Promise<Payout[]> {
  try {
    return await getMyPayoutHistory()
  } catch (error) {
    console.error("[fetchMyPayoutHistoryAction]", error)
    return []
  }
}

/**
 * Admin: read one merchant's live statement.
 *
 * Returns null rather than throwing so the panel can say "could not load" and
 * keep the rest of the page usable.
 */
export async function fetchStatementAction(
  restaurantId: string,
  cutoffDate?: string
): Promise<PayoutStatement | null> {
  try {
    return await getStatementFor(restaurantId, cutoffDate)
  } catch (error) {
    console.error("[fetchStatementAction]", error)
    return null
  }
}

export async function fetchPayoutHistoryAction(
  restaurantId: string
): Promise<Payout[]> {
  try {
    return await getPayoutHistoryFor(restaurantId)
  } catch (error) {
    console.error("[fetchPayoutHistoryAction]", error)
    return []
  }
}

/**
 * The API's messages here are specific and actionable — a mismatched amount, an
 * already-settled period, a blocked destination. Surfacing them verbatim beats
 * a generic failure an operator cannot do anything about.
 */
export async function recordPayoutAction(
  restaurantId: string,
  payload: RecordPayoutPayload
): Promise<PayoutActionResult> {
  try {
    await recordPayout(restaurantId, payload)
    revalidatePath("/dashboard/payouts")
    return { success: true, message: "Payout recorded as pending." }
  } catch (error) {
    return {
      success: false,
      message: extractApiMessage(error, "Could not record this payout"),
    }
  }
}

export async function completePayoutAction(
  payoutId: string,
  payload: CompletePayoutPayload
): Promise<PayoutActionResult> {
  try {
    await completePayout(payoutId, payload)
    revalidatePath("/dashboard/payouts")
    return {
      success: true,
      message: payload.failureReason
        ? "Payout marked as failed."
        : "Payout confirmed as paid.",
    }
  } catch (error) {
    return {
      success: false,
      message: extractApiMessage(error, "Could not update this payout"),
    }
  }
}

export async function createAdjustmentAction(
  restaurantId: string,
  payload: CreateAdjustmentPayload
): Promise<PayoutActionResult> {
  try {
    await createAdjustment(restaurantId, payload)
    revalidatePath("/dashboard/payouts")
    return { success: true, message: "Adjustment recorded." }
  } catch (error) {
    return {
      success: false,
      message: extractApiMessage(error, "Could not record this adjustment"),
    }
  }
}
