/**
 * TanStack Query hooks for the restaurant dashboard feature.
 *
 * Wire these into the dashboard restaurant/profile components:
 *   - `useMyRestaurant()`     loads the manager/admin's restaurant.
 *   - `useUpdateRestaurant()` optimistically PATCH updates the cache.
 *
 * No "use client" directive is required on this file — hooks are inherently
 * client-only utilities and only run inside components already within a
 * client boundary (e.g. the dashboard page or its container component).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientFetch, ClientFetchError } from "@/lib/api/fetch-client"
import type {
  PaginatedRestaurants,
  Restaurant,
  UpdateRestaurantPayload,
} from "../types"

export const RESTAURANT_QUERY_KEY = ["restaurant", "me"] as const

/**
 * Loads the current user's restaurant via GET /api/restaurant/me.
 * Returns `null` (with success) when no restaurant is assigned (404).
 */
export function useMyRestaurant() {
  return useQuery<Restaurant | null>({
    queryKey: RESTAURANT_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await clientFetch<Restaurant>("/restaurant/me")
        return data ?? null
      } catch (err) {
        // 404 = no restaurant linked — non-error flow for the UI.
        if (err instanceof ClientFetchError && err.status === 404) {
          return null
        }
        throw err
      }
    },
    retry: (count, err) =>
      err instanceof ClientFetchError
        ? err.status !== 404 && err.status !== 403 && count < 2
        : count < 2,
    staleTime: 60 * 1000,
  })
}

/**
 * PATCH /api/restaurant/me — optimistically updates the cached restaurant.
 * On error the cache is rolled back automatically by TanStack Query.
 */
export function useUpdateRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: FormData) => {
      const data = await clientFetch<Restaurant>("/restaurant/me", {
        method: "PATCH",
        body: payload,
      })
      return data as Restaurant
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Restaurant | null>(RESTAURANT_QUERY_KEY, updated)
      queryClient.invalidateQueries({ queryKey: RESTAURANTS_LIST_QUERY_KEY })
    },
  })
}

export const RESTAURANTS_LIST_QUERY_KEY = ["restaurants", "list"] as const

export interface GetRestaurantsQueryKeyParams {
  page?: number
  limit?: number
  search?: string
}

export function useRestaurantsList(params: GetRestaurantsQueryKeyParams = {}) {
  const queryKey = [...RESTAURANTS_LIST_QUERY_KEY, params] as const
  return useQuery<PaginatedRestaurants>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", String(params.page))
      if (params.limit) searchParams.set("limit", String(params.limit))
      if (params.search) searchParams.set("search", params.search)

      const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
      const data = await clientFetch<PaginatedRestaurants>(`/restaurants${qs}`)
      return data ?? { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: FormData) => {
      const data = await clientFetch<Restaurant>("/restaurants", {
        method: "POST",
        body: payload,
      })
      return data as Restaurant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANTS_LIST_QUERY_KEY })
    },
  })
}

/**
 * Admin PATCH of a restaurant.
 *
 * `payload` is FormData when an image is involved and a plain object otherwise.
 * The commercial-terms dialog uses the object form deliberately: multipart
 * would flatten `payoutDestination` to a string and `commissionRate` to text,
 * and the DTO would then be parsing what it should have received typed.
 */
export function useAdminUpdateRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: FormData | UpdateRestaurantPayload
    }) => {
      const data = await clientFetch<Restaurant>(`/restaurants/${id}`, {
        method: "PATCH",
        body: payload as unknown as Record<string, unknown>,
      })
      return data as Restaurant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANTS_LIST_QUERY_KEY })
    },
  })
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await clientFetch(`/restaurants/${id}`, {
        method: "DELETE",
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANTS_LIST_QUERY_KEY })
    },
  })
}

