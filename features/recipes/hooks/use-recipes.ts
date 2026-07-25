"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ClientFetchError, clientFetch } from "@/lib/api/fetch-client"
import type { ApiRecipe, UpsertRecipePayload } from "@/features/recipes/api/type"

export const RECIPES_QUERY_KEY = ["recipes"] as const

export function recipeQueryKey(productId: string | null) {
  return [...RECIPES_QUERY_KEY, "product", productId] as const
}

/**
 * Fetches a product's recipe.
 *
 * A product that has no recipe yet is a normal state, not a failure: the
 * upstream 404 is mapped to `null` so the editor can open empty. Every other
 * error still propagates and surfaces as `isError`.
 */
export function useProductRecipe(productId: string | null) {
  return useQuery<ApiRecipe | null>({
    queryKey: recipeQueryKey(productId),
    queryFn: async () => {
      if (!productId) return null
      try {
        const res = await clientFetch<ApiRecipe>(`/products/${productId}/recipe`)
        return res ?? null
      } catch (err) {
        if (err instanceof ClientFetchError && err.status === 404) return null
        throw err
      }
    },
    enabled: Boolean(productId),
    staleTime: 30 * 1000,
    // A missing recipe is a stable answer — retrying a 404 only adds latency.
    retry: (failureCount, err) =>
      err instanceof ClientFetchError && err.status < 500
        ? false
        : failureCount < 2,
  })
}

export function useUpsertProductRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      payload,
    }: {
      productId: string
      payload: UpsertRecipePayload
    }) => {
      const res = await clientFetch<ApiRecipe>(
        `/products/${productId}/recipe`,
        { method: "PUT", body: payload }
      )
      return res as ApiRecipe
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(recipeQueryKey(variables.productId), data ?? null)
      queryClient.invalidateQueries({
        queryKey: recipeQueryKey(variables.productId),
      })
    },
  })
}
