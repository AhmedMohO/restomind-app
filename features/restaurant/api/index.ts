/**
 * Server-side API wrappers for the Restaurant feature.
 *
 * These are thin typed wrappers around the existing `apiClient()` from
 * `@/lib/api/client`. All functions run server-side only — they attach
 * the user's access token (via apiClient) and return parsed JSON.
 *
 * Endpoints (per docs/API_DOCUMENTATION.md §10):
 *   GET   /restaurants/me        — manager's own restaurant
 *   GET   /restaurants/:id       — any restaurant by ID (admin)
 *   PATCH /restaurants/:id       — update restaurant fields
 */

import "server-only"

import { apiClient, publicApiClient } from "@/lib/api/client"
import { buildQueryString, extractApiMessage, parseOrThrow } from "@/lib/api/utils"
import { ApiError } from "@/lib/auth/errors"
import type { PaginatedRestaurants, Restaurant, UpdateRestaurantPayload } from "../types"

export type { PaginatedRestaurants, Restaurant, UpdateRestaurantPayload }

export interface GetRestaurantsParams {
  page?: number
  limit?: number
  search?: string
}

interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  message?: string | string[]
  error?: string
  [key: string]: unknown
}

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>
  if (!response.ok || body.success === false) {
    const msg = extractApiMessage(body, `API ${response.status}`)
    throw new ApiError(response.status, msg)
  }
  if (body.data === undefined && !body.message) {
    throw new Error("Unexpected API response — missing `data` field")
  }
  return (body.data ?? body) as T
}

/**
 * GET /restaurants — returns list/paginated active restaurants.
 */
export async function getRestaurants(
  params: GetRestaurantsParams = {}
): Promise<PaginatedRestaurants> {
  const qs = buildQueryString(params)
  const response = await publicApiClient(`/restaurants${qs}`)
  return parseOrThrow<PaginatedRestaurants>(response, "getRestaurants")
}

/**
 * GET /restaurants/me — returns the restaurant linked to the authenticated
 * manager's `restaurantId`.
 */
export async function getMyRestaurantApi(): Promise<Restaurant> {
  const res = await apiClient("/restaurants/me")
  return parseJson<Restaurant>(res)
}

/**
 * GET /restaurants/:id — returns any restaurant by ObjectId.
 * Requires admin role upstream.
 */
export async function getRestaurantByIdApi(id: string): Promise<Restaurant> {
  const res = await apiClient(`/restaurants/${encodeURIComponent(id)}`)
  return parseJson<Restaurant>(res)
}

/**
 * PATCH /restaurants/:id — updates restaurant fields (supports JSON or FormData).
 * Managers can only update their own assigned restaurant (enforced by backend).
 */
export async function updateRestaurantApi(
  id: string,
  payload: FormData | UpdateRestaurantPayload
): Promise<Restaurant> {
  const isFormData = payload instanceof FormData
  const res = await apiClient(`/restaurants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: isFormData ? payload : JSON.stringify(payload),
  })
  return parseJson<Restaurant>(res)
}

/**
 * POST /restaurants — creates a new restaurant (admin only, supports JSON or FormData).
 */
export async function createRestaurantApi(
  payload: FormData | Record<string, unknown>
): Promise<Restaurant> {
  const isFormData = payload instanceof FormData
  const res = await apiClient("/restaurants", {
    method: "POST",
    body: isFormData ? payload : JSON.stringify(payload),
  })
  return parseJson<Restaurant>(res)
}

/**
 * DELETE /restaurants/:id — soft deletes a restaurant (admin only).
 */
export async function deleteRestaurantApi(id: string): Promise<{ message: string }> {
  const res = await apiClient(`/restaurants/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>
    const msg = extractApiMessage(body, `API ${res.status}`)
    throw new ApiError(res.status, msg)
  }
  return { message: "Restaurant deleted successfully" }
}




