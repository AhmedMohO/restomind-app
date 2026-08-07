import type { ApiCartItem } from "./api/type"

export interface CartItemRestaurantInfo {
  id: string
  name: string
}

export function getCartItemRestaurant(item: ApiCartItem): CartItemRestaurantInfo {
  const rest = item?.offer?.restaurantId
  if (rest && typeof rest === "object") {
    return {
      id: rest._id || "",
      name: rest.name || "",
    }
  }

  const prodRest = item?.offer?.productId?.restaurantId
  if (prodRest && typeof prodRest === "object") {
    return {
      id: prodRest._id || (typeof rest === "string" ? rest : ""),
      name: prodRest.name || "",
    }
  }

  const id = typeof rest === "string" ? rest : typeof prodRest === "string" ? prodRest : ""
  return {
    id,
    name: "",
  }
}

export function getCartItemRestaurantName(item: ApiCartItem): string {
  return getCartItemRestaurant(item).name
}

export function getCartItemRestaurantId(item: ApiCartItem): string {
  return getCartItemRestaurant(item).id
}

/**
 * Checks if all cart items belong to the same restaurant.
 * Returns true if cart has 0 or 1 items, or if all items share the same restaurant ID.
 */
export function isSameRestaurantCart(cart: ApiCartItem[]): boolean {
  if (!cart || cart.length <= 1) return true

  const restaurantIds = new Set<string>()
  for (const item of cart) {
    const id = getCartItemRestaurantId(item)
    if (id) {
      restaurantIds.add(id)
    }
  }

  return restaurantIds.size <= 1
}
