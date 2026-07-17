import { cacheLife, cacheTag } from "next/cache"
import { MOCK_PRODUCTS } from "@/features/products/data"
import type { Product } from "@/features/products/types"

export async function getCachedProduct(id: string): Promise<Product | null> {
  "use cache"
  cacheLife("days")
  cacheTag(`product-${id}`)
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null
}
