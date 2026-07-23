import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type { ApiCategory, GetCategoriesParams, PaginatedCategories } from "@/features/categories/api/type"

export const CATEGORIES_QUERY_KEY = ["categories"] as const

export function useCategoriesList(params: GetCategoriesParams = {}) {
  const queryKey = [...CATEGORIES_QUERY_KEY, params] as const
  return useQuery<PaginatedCategories>({
    queryKey,
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedCategories>(`/categories${qs}`)
      return res ?? { data: [], page: 1, limit: 10, totalPages: 1, total: 0, totalCount: 0 }
    },
    staleTime: 30 * 1000,
  })
}

export function useCategoryById(id: string) {
  return useQuery<ApiCategory | null>({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) return null
      const res = await clientFetch<ApiCategory>(`/categories/${id}`)
      return res ?? null
    },
    enabled: Boolean(id),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const data = await clientFetch<ApiCategory>("/categories", {
        method: "POST",
        body: formData,
      })
      return data as ApiCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const data = await clientFetch<ApiCategory>(`/categories/${id}`, {
        method: "PATCH",
        body: formData,
      })
      return data as ApiCategory
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["category", variables.id] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await clientFetch<{ message: string }>(`/categories/${id}`, {
        method: "DELETE",
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}
