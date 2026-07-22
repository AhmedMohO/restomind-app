import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type { ApiFavorite, FavoritesListResponse, FavoriteStatusResponse } from "./type"

export * from "./type"

/** POST /favorites/:offerId — add offer to favorites (customer only) */
export async function addFavorite(offerId: string): Promise<{ data: ApiFavorite }> {
  const response = await apiClient(`/favorites/${offerId}`, { method: "POST" })
  return parseOrThrow<{ data: ApiFavorite }>(response, "addFavorite")
}

/** DELETE /favorites/:offerId — remove offer from favorites (customer only) */
export async function removeFavorite(offerId: string): Promise<{ message: string }> {
  const response = await apiClient(`/favorites/${offerId}`, { method: "DELETE" })
  return parseOrThrow<{ message: string }>(response, "removeFavorite")
}

/** GET /favorites — get all favorite offers (customer only) */
export async function getFavorites(): Promise<FavoritesListResponse> {
  const response = await apiClient("/favorites")
  return parseOrThrow<FavoritesListResponse>(response, "getFavorites")
}

/** GET /favorites/:offerId/status — check if offer is in favorites (customer only) */
export async function checkIsFavorite(offerId: string): Promise<FavoriteStatusResponse> {
  const response = await apiClient(`/favorites/${offerId}/status`)
  return parseOrThrow<FavoriteStatusResponse>(response, "checkIsFavorite")
}
