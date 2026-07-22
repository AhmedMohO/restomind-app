import "server-only"

import { apiClient, publicApiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  CreateRestaurantPayload,
  GetRestaurantsParams,
  PaginatedRestaurants,
  Restaurant,
  UpdateRestaurantPayload,
} from "../types"

export * from "../types"

/** GET /restaurants — fetch paginated list of restaurants (public) */
export async function getRestaurants(
  params: GetRestaurantsParams = {}
): Promise<PaginatedRestaurants> {
  const qs = buildQueryString(params)
  const response = await publicApiClient(`/restaurants${qs}`)
  return parseOrThrow<PaginatedRestaurants>(response, "getRestaurants")
}

/** GET /restaurants/me — get current manager's assigned restaurant (authenticated) */
export async function getMyRestaurant(): Promise<{ data: Restaurant }> {
  const response = await apiClient("/restaurants/me")
  return parseOrThrow<{ data: Restaurant }>(response, "getMyRestaurant")
}

/** GET /restaurants/:id — get restaurant by ID (authenticated) */
export async function getRestaurantById(
  id: string
): Promise<{ data: Restaurant }> {
  const response = await apiClient(`/restaurants/${id}`)
  return parseOrThrow<{ data: Restaurant }>(response, "getRestaurantById")
}

/** POST /restaurants — create a new restaurant (admin only) */
export async function createRestaurant(
  body: CreateRestaurantPayload
): Promise<{ data: Restaurant }> {
  const response = await apiClient("/restaurants", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return parseOrThrow<{ data: Restaurant }>(response, "createRestaurant")
}

/** PATCH /restaurants/:id — update restaurant details (admin/manager) */
export async function updateRestaurant(
  id: string,
  body: UpdateRestaurantPayload
): Promise<{ data: Restaurant }> {
  const response = await apiClient(`/restaurants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
  return parseOrThrow<{ data: Restaurant }>(response, "updateRestaurant")
}

/** DELETE /restaurants/:id — soft delete restaurant (admin only) */
export async function deleteRestaurant(
  id: string
): Promise<{ data: Restaurant }> {
  const response = await apiClient(`/restaurants/${id}`, {
    method: "DELETE",
  })
  return parseOrThrow<{ data: Restaurant }>(response, "deleteRestaurant")
}
