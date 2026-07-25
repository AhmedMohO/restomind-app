"use client"

import { useQuery } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import {
  EMPTY_SALES_PAGE,
  EMPTY_SALES_SUMMARY,
  type GetSalesParams,
  type GetSalesSummaryParams,
  type PaginatedSales,
  type SalesSummary,
} from "@/features/sales/api/type"

export const SALES_QUERY_KEY = ["sales"] as const

export function useSalesList(params: GetSalesParams = {}) {
  return useQuery<PaginatedSales>({
    queryKey: [...SALES_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedSales>(`/sales${qs}`)
      return res ?? EMPTY_SALES_PAGE
    },
    staleTime: 60 * 1000,
    // Keeps the previous page on screen while the next one loads instead of
    // flashing the empty state on every filter change.
    placeholderData: (previous) => previous,
  })
}

export function useSalesSummary(params: GetSalesSummaryParams = {}) {
  return useQuery<SalesSummary>({
    queryKey: [...SALES_QUERY_KEY, "summary", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<SalesSummary>(`/sales/summary${qs}`)
      return res ?? EMPTY_SALES_SUMMARY
    },
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  })
}
