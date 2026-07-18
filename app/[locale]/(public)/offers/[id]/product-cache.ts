import { cacheLife, cacheTag } from "next/cache"
import { getProductById, type ApiProduct } from "@/features/products/api"

export async function getCachedProduct(id: string): Promise<ApiProduct | null> {
  "use cache"
  cacheTag(`product:${id}`, "products")
  cacheLife("hours")

  try {
    const res = await getProductById(id)
    if (res?.data) return res.data
  } catch {
    // API unavailable during prerendering
  }
  return null
}
