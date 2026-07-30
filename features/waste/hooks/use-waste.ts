"use client"

import { useQuery } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import {
  EMPTY_WASTE_PAGE,
  EMPTY_WASTE_SUMMARY,
  type GetWasteReportsParams,
  type PaginatedWasteReports,
  type WasteSummary,
} from "@/features/waste/api/type"

/**
 * Must be exactly `["waste-reports"]` — `useScanSurplus` (Task 3,
 * `features/recommendations/hooks/use-recommendations.ts`) invalidates this
 * literal key on `onSettled` for every scan outcome, including a degraded
 * one, since the backend commits waste reports before it ever calls the AI.
 */
export const WASTE_QUERY_KEY = ["waste-reports"] as const

export function useWasteReports(params: GetWasteReportsParams = {}) {
  return useQuery<PaginatedWasteReports>({
    queryKey: [...WASTE_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedWasteReports>(
        `/waste-reports${qs}`
      )
      return res ?? EMPTY_WASTE_PAGE
    },
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  })
}

export function useWasteSummary(days = 30) {
  return useQuery<WasteSummary>({
    queryKey: [...WASTE_QUERY_KEY, "summary", days],
    queryFn: async () =>
      (await clientFetch<WasteSummary>(
        `/waste-reports/summary?days=${days}`
      )) ?? EMPTY_WASTE_SUMMARY,
    staleTime: 60 * 1000,
  })
}
