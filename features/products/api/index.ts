import "server-only"

import { apiClient, publicApiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  ApiProduct,
  GetProductsParams,
  GetRecommendedProductsParams,
  PaginatedProducts,
} from "./type"

export * from "./type"

/** GET /products — paginated & filtered list (public) */
export async function getProducts(params: GetProductsParams = {}): Promise<PaginatedProducts> {
  const qs = buildQueryString(params)
  const response = await publicApiClient(`/products${qs}`)
  return parseOrThrow<PaginatedProducts>(response, "getProducts")
}

/** GET /products/recommendations — discounted products (public) */
export async function getRecommendedProducts(
  params: GetRecommendedProductsParams = {}
): Promise<PaginatedProducts> {
  const qs = buildQueryString(params)
  const response = await publicApiClient(`/products/recommendations${qs}`)
  return parseOrThrow<PaginatedProducts>(response, "getRecommendedProducts")
}

/** GET /products/:id — product details (public) */
export async function getProductById(id: string): Promise<{ data: ApiProduct }> {
  const response = await publicApiClient(`/products/${id}`)
  return parseOrThrow<{ data: ApiProduct }>(response, "getProductById")
}

/** POST /products — create product (admin only, multipart/form-data) */
export async function createProduct(formData: FormData): Promise<{ data: ApiProduct }> {
  const response = await apiClient("/products", {
    method: "POST",
    body: formData,
  })
  return parseOrThrow<{ data: ApiProduct }>(response, "createProduct")
}

/** PATCH /products/:id — update product (admin only, multipart/form-data) */
export async function updateProduct(
  id: string,
  formData: FormData
): Promise<{ data: ApiProduct }> {
  const response = await apiClient(`/products/${id}`, {
    method: "PATCH",
    body: formData,
  })
  return parseOrThrow<{ data: ApiProduct }>(response, "updateProduct")
}

/** DELETE /products/:id — soft delete product (admin only) */
export async function deleteProduct(id: string): Promise<{ message: string }> {
  const response = await apiClient(`/products/${id}`, { method: "DELETE" })
  return parseOrThrow<{ message: string }>(response, "deleteProduct")
}

/** PATCH /products/:id/availability — toggle product availability (admin only) */
export async function changeProductAvailability(
  id: string,
  isAvailable: boolean
): Promise<{ data: ApiProduct }> {
  const response = await apiClient(`/products/${id}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  })
  return parseOrThrow<{ data: ApiProduct }>(response, "changeProductAvailability")
}

/** PATCH /products/:id/discount — update product discount (admin only) */
export async function updateProductDiscount(
  id: string,
  discountedPrice: number
): Promise<{ data: ApiProduct }> {
  const response = await apiClient(`/products/${id}/discount`, {
    method: "PATCH",
    body: JSON.stringify({ discountedPrice }),
  })
  return parseOrThrow<{ data: ApiProduct }>(response, "updateProductDiscount")
}
