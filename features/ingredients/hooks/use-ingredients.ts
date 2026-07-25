"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import {
  EMPTY_INGREDIENTS_PAGE,
  type ApiIngredient,
  type GetIngredientsParams,
  type IngredientPayload,
  type PaginatedIngredients,
} from "@/features/ingredients/api/type"

export const INGREDIENTS_QUERY_KEY = ["ingredients"] as const

/** Recipes embed ingredient data, so any ingredient write invalidates them too. */
const RECIPES_QUERY_KEY = ["recipes"] as const

export function useIngredientsList(params: GetIngredientsParams = {}) {
  return useQuery<PaginatedIngredients>({
    queryKey: [...INGREDIENTS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedIngredients>(`/ingredients${qs}`)
      return res ?? EMPTY_INGREDIENTS_PAGE
    },
    staleTime: 30 * 1000,
    placeholderData: (previous) => previous,
  })
}

export function useIngredientById(id: string | null) {
  return useQuery<ApiIngredient | null>({
    queryKey: [...INGREDIENTS_QUERY_KEY, "details", id],
    queryFn: async () => {
      if (!id) return null
      const res = await clientFetch<ApiIngredient>(`/ingredients/${id}`)
      return res ?? null
    },
    enabled: Boolean(id),
  })
}

/**
 * Shared invalidation for every ingredient mutation: the list, the single
 * ingredient (when known), and any recipe that displays ingredient details.
 */
function useIngredientInvalidation() {
  const queryClient = useQueryClient()

  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY })
    if (id) {
      queryClient.invalidateQueries({
        queryKey: [...INGREDIENTS_QUERY_KEY, "details", id],
      })
    }
  }
}

export function useCreateIngredient() {
  const invalidate = useIngredientInvalidation()

  return useMutation({
    mutationFn: async (payload: IngredientPayload) => {
      const res = await clientFetch<ApiIngredient>("/ingredients", {
        method: "POST",
        body: payload,
      })
      return res as ApiIngredient
    },
    onSuccess: () => invalidate(),
  })
}

export function useUpdateIngredient() {
  const invalidate = useIngredientInvalidation()

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<IngredientPayload>
    }) => {
      const res = await clientFetch<ApiIngredient>(`/ingredients/${id}`, {
        method: "PATCH",
        body: payload,
      })
      return res as ApiIngredient
    },
    onSuccess: (_data, variables) => invalidate(variables.id),
  })
}

export function useDeleteIngredient() {
  const invalidate = useIngredientInvalidation()

  return useMutation({
    mutationFn: async (id: string) => {
      await clientFetch<{ message: string }>(`/ingredients/${id}`, {
        method: "DELETE",
      })
      return id
    },
    onSuccess: (id) => invalidate(id),
  })
}
