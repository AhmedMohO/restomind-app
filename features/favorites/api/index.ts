import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { ApiFavorite, FavoritesListResponse, FavoriteStatusResponse } from "./type"

export * from "./type"

/** POST /favorites/:productId — add product to favorites (customer only) */
export async function addFavorite(productId: string): Promise<{ data: ApiFavorite }> {
  const response = await apiClient(`/favorites/${productId}`, { method: "POST" })
  return parseOrThrow<{ data: ApiFavorite }>(response, "addFavorite")
}

/** DELETE /favorites/:productId — remove product from favorites (customer only) */
export async function removeFavorite(productId: string): Promise<{ message: string }> {
  const response = await apiClient(`/favorites/${productId}`, { method: "DELETE" })
  return parseOrThrow<{ message: string }>(response, "removeFavorite")
}

/** GET /favorites — get all favorite products (customer only) */
export async function getFavorites(): Promise<FavoritesListResponse> {
  const response = await apiClient("/favorites")
  return parseOrThrow<FavoritesListResponse>(response, "getFavorites")
}

/** GET /favorites/:productId/status — check if product is in favorites (customer only) */
export async function checkIsFavorite(productId: string): Promise<FavoriteStatusResponse> {
  const response = await apiClient(`/favorites/${productId}/status`)
  return parseOrThrow<FavoriteStatusResponse>(response, "checkIsFavorite")
}
