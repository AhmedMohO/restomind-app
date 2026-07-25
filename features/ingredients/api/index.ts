import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  ApiIngredient,
  GetIngredientsParams,
  IngredientPayload,
  PaginatedIngredients,
} from "./type"

export * from "./type"

/** GET /ingredients — paginated ingredient inventory (manager, own restaurant) */
export async function getIngredients(
  params: GetIngredientsParams = {}
): Promise<PaginatedIngredients> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/ingredients${qs}`)
  return parseOrThrow<PaginatedIngredients>(response, "getIngredients")
}

/** GET /ingredients/:id — single ingredient (manager, own restaurant) */
export async function getIngredientById(
  id: string
): Promise<{ data: ApiIngredient }> {
  const response = await apiClient(`/ingredients/${id}`)
  return parseOrThrow<{ data: ApiIngredient }>(response, "getIngredientById")
}

/** POST /ingredients — create ingredient (manager) */
export async function createIngredient(
  payload: IngredientPayload
): Promise<{ data: ApiIngredient }> {
  const response = await apiClient("/ingredients", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return parseOrThrow<{ data: ApiIngredient }>(response, "createIngredient")
}

/** PATCH /ingredients/:id — update ingredient (manager) */
export async function updateIngredient(
  id: string,
  payload: Partial<IngredientPayload>
): Promise<{ data: ApiIngredient }> {
  const response = await apiClient(`/ingredients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return parseOrThrow<{ data: ApiIngredient }>(response, "updateIngredient")
}

/** DELETE /ingredients/:id — soft delete (manager). 400 when used by a recipe. */
export async function deleteIngredient(
  id: string
): Promise<{ message: string }> {
  const response = await apiClient(`/ingredients/${id}`, { method: "DELETE" })
  return parseOrThrow<{ message: string }>(response, "deleteIngredient")
}
