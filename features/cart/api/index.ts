import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { AddToCartPayload, ApiCart } from "./type"

export * from "./type"

/** GET /cart — get active cart (customer only) */
export async function getCart(): Promise<{ data: ApiCart }> {
  const response = await apiClient("/cart")
  return parseOrThrow<{ data: ApiCart }>(response, "getCart")
}

/** POST /cart — add/increment product in cart (customer only) */
export async function addToCart(payload: AddToCartPayload): Promise<{ data: ApiCart }> {
  const response = await apiClient("/cart", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return parseOrThrow<{ data: ApiCart }>(response, "addToCart")
}

/** DELETE /cart/:productId — remove product from cart (customer only) */
export async function removeFromCart(productId: string): Promise<{ data: ApiCart }> {
  const response = await apiClient(`/cart/${productId}`, { method: "DELETE" })
  return parseOrThrow<{ data: ApiCart }>(response, "removeFromCart")
}

/** PATCH /cart/:productId — update product quantity in cart (customer only) */
export async function updateCartItemQuantity(
  productId: string,
  quantity: number
): Promise<{ data: ApiCart }> {
  const response = await apiClient(`/cart/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  })
  return parseOrThrow<{ data: ApiCart }>(response, "updateCartItemQuantity")
}

/** DELETE /cart — clear entire cart (customer only) */
export async function clearCart(): Promise<{ message: string }> {
  const response = await apiClient("/cart", { method: "DELETE" })
  return parseOrThrow<{ message: string }>(response, "clearCart")
}
