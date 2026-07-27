import type { ApiProduct } from "@/features/products/api/type"
import type { ApiOffer } from "@/features/offers/api/type"

/**
 * Resolves the product ID string from an offer's `productId` field,
 * which may be a populated object or a bare string reference.
 */
export function resolveInitialProductId(initialData?: ApiOffer | null): string {
  if (!initialData) return ""
  if (typeof initialData.productId === "object" && initialData.productId !== null) {
    return initialData.productId._id
  }
  if (typeof initialData.productId === "string") {
    return initialData.productId
  }
  return ""
}

/**
 * Resolves the original product price from an offer.
 * Prefers the populated product object price; falls back to `originalPrice`.
 */
export function resolveInitialOriginalPrice(initialData?: ApiOffer | null): number {
  if (!initialData) return 0
  if (typeof initialData.productId === "object" && initialData.productId !== null) {
    return initialData.productId.price
  }
  return initialData.originalPrice ?? 0
}

/**
 * Returns the populated ApiProduct object from an offer if available, otherwise null.
 */
export function resolveInitialSelectedProduct(initialData?: ApiOffer | null): ApiProduct | null {
  if (
    initialData &&
    typeof initialData.productId === "object" &&
    initialData.productId !== null
  ) {
    return initialData.productId
  }
  return null
}
