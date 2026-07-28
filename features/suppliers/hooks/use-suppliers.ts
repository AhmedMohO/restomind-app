import { useQuery } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type { GetSuppliersParams, PaginatedSuppliers } from "../types"

export const SUPPLIERS_QUERY_KEY = ["suppliers"] as const

export function useSuppliersList(params: GetSuppliersParams = {}) {
  return useQuery<PaginatedSuppliers>({
    queryKey: [...SUPPLIERS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedSuppliers>(`/suppliers${qs}`)
      return res ?? { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 60 * 1000,
  })
}
