import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  ApiProduct,
  GetProductsParams,
  PaginatedProducts,
} from "@/features/products/api/type"

export const PRODUCTS_QUERY_KEY = ["products"] as const

export function useProductsList(params: GetProductsParams = {}) {
  return useQuery<PaginatedProducts>({
    queryKey: [...PRODUCTS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedProducts>(`/products${qs}`)
      return res ?? { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 30 * 1000,
  })
}

export function useProductById(id: string | null) {
  return useQuery<ApiProduct | null>({
    queryKey: [...PRODUCTS_QUERY_KEY, "details", id],
    queryFn: async () => {
      if (!id) return null
      const res = await clientFetch<ApiProduct>(`/products/${id}`)
      return res ?? null
    },
    enabled: Boolean(id),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await clientFetch<ApiProduct>("/products", {
        method: "POST",
        body: formData,
      })
      return res as ApiProduct
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await clientFetch<ApiProduct>(`/products/${id}`, {
        method: "PATCH",
        body: formData,
      })
      return res as ApiProduct
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, "details", variables.id],
      })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await clientFetch<{ message: string }>(`/products/${id}`, {
        method: "DELETE",
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    },
  })
}

export function useChangeProductAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: string
      isAvailable: boolean
    }) => {
      const res = await clientFetch<ApiProduct>(`/products/${id}/availability`, {
        method: "PATCH",
        body: { isAvailable },
      })
      return res as ApiProduct
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, "details", variables.id],
      })
    },
  })
}
