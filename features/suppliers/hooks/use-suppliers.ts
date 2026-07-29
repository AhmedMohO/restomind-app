"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  ApiSupplier,
  CreateSupplierPayload,
  GetSuppliersParams,
  PaginatedSuppliers,
} from "../types"

export const SUPPLIERS_QUERY_KEY = ["suppliers"] as const
export const SUPPLIERS_SELECT_QUERY_KEY = ["suppliers-select"] as const

export function useSuppliersList(params: GetSuppliersParams = {}) {
  return useQuery<PaginatedSuppliers>({
    queryKey: [...SUPPLIERS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedSuppliers>(`/suppliers${qs}`)
      return res ?? { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 30 * 1000,
    placeholderData: (previous) => previous,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSupplierPayload) => {
      const res = await clientFetch<{ data?: ApiSupplier } | ApiSupplier>("/suppliers", {
        method: "POST",
        body: payload as unknown as Record<string, unknown>,
      })
      const result = res && "data" in res && res.data ? res.data : (res as ApiSupplier)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_SELECT_QUERY_KEY })
    },
  })
}

