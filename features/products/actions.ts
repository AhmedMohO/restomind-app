"use server"

import {
  getProducts,
  getProductById,
  getRecommendedProducts,
  type GetProductsParams,
  type GetRecommendedProductsParams,
  type ApiProduct,
  type PaginatedProducts,
} from "./api"

/** Server Action: Fetch paginated & filtered products */
export async function fetchProductsAction(
  params: GetProductsParams = {}
): Promise<PaginatedProducts> {
  return getProducts(params)
}

/** Server Action: Fetch recommended products */
export async function fetchRecommendedProductsAction(
  params: GetRecommendedProductsParams = {}
): Promise<PaginatedProducts> {
  return getRecommendedProducts(params)
}

/** Server Action: Fetch single product details */
export async function fetchProductByIdAction(
  id: string
): Promise<{ data: ApiProduct } | null> {
  try {
    return await getProductById(id)
  } catch (error) {
    console.error(`[fetchProductByIdAction] Error fetching product ${id}:`, error)
    return null
  }
}
