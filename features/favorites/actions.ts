"use server"

import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkIsFavorite,
  type ApiFavorite,
} from "./api"
import type { ApiOffer } from "@/features/offers/api"
import { AuthenticationError } from "@/lib/auth/errors"
import type { ActionResult } from "@/features/cart/actions"

/** Server Action: Fetch user favorites */
export async function getFavoritesAction(): Promise<ActionResult<ApiOffer[]>> {
  try {
    const res = await getFavorites()
    return { success: true, data: res.data || [] }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch favorites",
    }
  }
}

/** Server Action: Add offer to favorites */
export async function addFavoriteAction(
  offerId: string
): Promise<ActionResult<ApiFavorite>> {
  try {
    const res = await addFavorite(offerId)
    return { success: true, data: res.data }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add favorite",
    }
  }
}

/** Server Action: Remove offer from favorites */
export async function removeFavoriteAction(
  offerId: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const res = await removeFavorite(offerId)
    return { success: true, data: res }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove favorite",
    }
  }
}

/** Server Action: Toggle favorite status for an offer */
export async function toggleFavoriteAction(
  offerId: string
): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    const statusRes = await checkIsFavorite(offerId)
    if (statusRes.isFavorite) {
      await removeFavorite(offerId)
      return { success: true, data: { isFavorite: false } }
    } else {
      await addFavorite(offerId)
      return { success: true, data: { isFavorite: true } }
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { success: false, error: "UNAUTHENTICATED" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle favorite",
    }
  }
}
