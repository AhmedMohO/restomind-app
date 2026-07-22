"use server"

import { ApiOrderGroup, createOrder, type CreateOrderPayload } from "./api"
import { AuthenticationError } from "@/lib/auth/errors"
import { extractApiMessage } from "@/lib/api/utils"

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; message: string }

/** Server Action: Create an order from the active cart. */
export async function createOrderAction(
  payload: CreateOrderPayload
): Promise<ActionResult<ApiOrderGroup | ApiOrderGroup[]>> {
  try {
    const res = await createOrder(payload)
    return { success: true, data: res.data }
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
