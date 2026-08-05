"use server"

import {
  ApiOrderGroup,
  createOrder,
  getOrderGroupById,
  type CreateOrderPayload,
} from "./api"
import { AuthenticationError } from "@/lib/auth/errors"
import { extractApiMessage } from "@/lib/api/utils"

export type ActionResult<T> =
  | { success: true; data: T; checkoutUrl?: string }
  | { success: false; error: string; message: string }

/** Server Action: Create an order from the active cart. */
export async function createOrderAction(
  payload: CreateOrderPayload
): Promise<ActionResult<ApiOrderGroup | ApiOrderGroup[]>> {
  try {
    const res = await createOrder(payload)
    // For card/wallet the caller must redirect to checkoutUrl rather than
    // treating the order as placed — it is only reserved until Paymob
    // confirms the payment.
    return { success: true, data: res.data, checkoutUrl: res.checkoutUrl }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return {
        success: false,
        error: "UNAUTHENTICATED",
        message: "Please log in to place your order.",
      }
    }
    return {
      success: false,
      error: "ORDER_FAILED",
      message: extractApiMessage(error, "Failed to place order"),
    }
  }
}

/**
 * Server Action: read an order group's current overall status.
 *
 * Used by the post-payment result screen to poll. The Paymob redirect's query
 * parameters are NOT authenticated and are never trusted — only the status on
 * our own server, written by the HMAC-verified webhook, decides whether a
 * payment succeeded.
 *
 * Returns null when the group cannot be read, so the caller keeps waiting
 * rather than showing a false failure.
 */
export async function fetchOrderGroupStatusAction(
  groupId: string
): Promise<string | null> {
  try {
    const res = await getOrderGroupById(groupId)
    return res.data.overallStatus ?? null
  } catch (error) {
    console.error("[fetchOrderGroupStatusAction]", error)
    return null
  }
}
