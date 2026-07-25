import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import {
  EMPTY_SALES_PAGE,
  EMPTY_SALES_SUMMARY,
  type GetSalesParams,
  type GetSalesSummaryParams,
  type PaginatedSales,
  type SalesSummary,
} from "./type"

export * from "./type"

/**
 * GET /sales — paginated sales transactions (admin, or manager scoped to their
 * own restaurant). Unwraps the upstream `{ data: { items, … } }` envelope.
 */
export async function getSales(
  params: GetSalesParams = {}
): Promise<PaginatedSales> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/sales${qs}`)
  const body = await parseOrThrow<{ data?: PaginatedSales }>(
    response,
    "getSales"
  )
  return body.data ?? EMPTY_SALES_PAGE
}

/** GET /sales/summary — aggregate financial totals for the same filter set. */
export async function getSalesSummary(
  params: GetSalesSummaryParams = {}
): Promise<SalesSummary> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/sales/summary${qs}`)
  const body = await parseOrThrow<{ data?: SalesSummary }>(
    response,
    "getSalesSummary"
  )
  return body.data ?? EMPTY_SALES_SUMMARY
}
