"use server"

import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  type AddToCartPayload,
  type ApiCart,
} from "./api"
import { AuthenticationError } from "@/lib/auth/errors"

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/** Server Action: Fetch active customer cart */
export async function fetchCartAction(): Promise<ActionResult<ApiCart>> {
  try {
    const res = await getCart()
    return { success: true, data: res.data }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch cart",
    }
  }
}

/** Server Action: Add product item to cart */
export async function addToCartAction(
  payload: AddToCartPayload
): Promise<ActionResult<ApiCart>> {
  try {
    const res = await addToCart(payload)
    return { success: true, data: res.data }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add to cart",
    }
  }
}

/** Server Action: Remove item from cart */
export async function removeFromCartAction(
  productId: string
): Promise<ActionResult<ApiCart>> {
  try {
    const res = await removeFromCart(productId)
    return { success: true, data: res.data }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove from cart",
    }
  }
}

/** Server Action: Update cart item quantity */
export async function updateCartQuantityAction(
  productId: string,
  quantity: number
): Promise<ActionResult<ApiCart>> {
  try {
    const res = await updateCartItemQuantity(productId, quantity)
    return { success: true, data: res.data }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cart quantity",
    }
  }
}

/** Server Action: Clear entire cart */
export async function clearCartAction(): Promise<ActionResult<{ message: string }>> {
  try {
    const res = await clearCart()
    return { success: true, data: res }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cart",
    }
  }
}
