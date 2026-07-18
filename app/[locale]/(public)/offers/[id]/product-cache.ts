import { getProductById, type ApiProduct } from "@/features/products/api"
import { MOCK_PRODUCTS } from "@/features/products/data"

export async function getCachedProduct(id: string): Promise<ApiProduct | null> {
  try {
    const res = await getProductById(id)
    if (res?.data) return res.data
  } catch {
    // API unavailable during prerendering — fallback to mock data
  }
  // return MOCK_PRODUCTS.find((p) => p._id === id) ?? null
  return null
}
