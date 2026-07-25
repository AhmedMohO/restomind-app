import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { ApiRecipe, UpsertRecipePayload } from "./type"

export * from "./type"

/**
 * GET /products/:productId/recipe — recipe with populated ingredients.
 * Throws `ApiError(404)` when the product has no recipe yet.
 */
export async function getProductRecipe(
  productId: string
): Promise<{ data: ApiRecipe }> {
  const response = await apiClient(`/products/${productId}/recipe`)
  return parseOrThrow<{ data: ApiRecipe }>(response, "getProductRecipe")
}

/** PUT /products/:productId/recipe — create or replace the recipe (manager) */
export async function upsertProductRecipe(
  productId: string,
  payload: UpsertRecipePayload
): Promise<{ data: ApiRecipe }> {
  const response = await apiClient(`/products/${productId}/recipe`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  return parseOrThrow<{ data: ApiRecipe }>(response, "upsertProductRecipe")
}
