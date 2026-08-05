"use server"

import { revalidatePath } from "next/cache"

import {
  createRefund,
  getRefunds,
  reviewRefund,
  type ApiRefund,
  type CreateRefundPayload,
} from "./api"
import { extractApiMessage } from "@/lib/api/utils"

export type RefundActionResult =
  | { success: true; message: string }
  | { success: false; message: string }

export async function fetchRefundsAction(): Promise<ApiRefund[]> {
  try {
    const res = await getRefunds()
    return res.data ?? []
  } catch (error) {
    console.error("[fetchRefundsAction]", error)
    return []
  }
}

export async function createRefundAction(
  groupId: string,
  payload: CreateRefundPayload
): Promise<RefundActionResult> {
  try {
    const res = await createRefund(groupId, payload)
    revalidatePath("/dashboard/refunds")
    return {
      success: true,
      message: res.message ?? "Refund issued.",
    }
  } catch (error) {
    // The API returns readable, specific reasons here — an over-refund, a
    // closed dispute window, a wrong-status order. Surfacing the raw message
    // beats a generic failure the operator cannot act on.
    return {
      success: false,
      message: extractApiMessage(error, "Could not issue this refund"),
    }
  }
}

export async function reviewRefundAction(
  refundId: string,
  decision: "approve" | "reject",
  rejectionReason?: string
): Promise<RefundActionResult> {
  try {
    const res = await reviewRefund(refundId, decision, rejectionReason)
    revalidatePath("/dashboard/refunds")
    return { success: true, message: res.message }
  } catch (error) {
    return {
      success: false,
      message: extractApiMessage(error, "Could not review this refund"),
    }
  }
}
