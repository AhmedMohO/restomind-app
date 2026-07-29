"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import {
  EMPTY_RECOMMENDATIONS_PAGE,
  type GetRecommendationsParams,
  type PaginatedRecommendations,
  type ScanSurplusResult,
} from "@/features/recommendations/api/type"
import type { ApproveRecommendationInput } from "@/schemas/recommendation"

export const RECOMMENDATIONS_QUERY_KEY = ["recommendations"] as const

export function useRecommendationsList(params: GetRecommendationsParams = {}) {
  return useQuery<PaginatedRecommendations>({
    queryKey: [...RECOMMENDATIONS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedRecommendations>(
        `/recommendations${qs}`
      )
      return res ?? EMPTY_RECOMMENDATIONS_PAGE
    },
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  })
}

export function useScanSurplus() {
  const qc = useQueryClient()
  return useMutation<{ data: ScanSurplusResult; degraded: boolean; degradedReason?: string }>({
    mutationFn: async () =>
      (await clientFetch("/recommendations/scan-surplus", { method: "POST" }))!,
    // Invalidate on BOTH paths: the backend commits waste reports before the
    // AI call, so a degraded scan still changed data.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["waste-reports"] })
    },
  })
}

export function useApproveRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: ApproveRecommendationInput
    }) =>
      clientFetch(`/recommendations/${id}/approve`, {
        method: "PATCH",
        body: input,
      }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY })
      const snapshot = qc.getQueriesData({ queryKey: RECOMMENDATIONS_QUERY_KEY })
      qc.setQueriesData<PaginatedRecommendations>(
        { queryKey: RECOMMENDATIONS_QUERY_KEY },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((r) =>
                  r._id === id ? { ...r, status: "approved" as const } : r
                ),
              }
            : old
      )
      return { snapshot }
    },
    onError: (err: unknown, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
      const status = (err as { status?: number })?.status
      // These are distinct outcomes, not one generic failure.
      if (status === 409) toast.error("An active offer already exists for this product")
      else if (status === 400) toast.error("This recommendation can no longer be approved")
      else if (status === 404) toast.error("The product no longer exists")
      else toast.error("Could not approve the recommendation")
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY }),
  })
}

export function useEditRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, suggestedValue }: { id: string; suggestedValue: number }) =>
      clientFetch(`/recommendations/${id}/edit`, {
        method: "PATCH",
        body: { suggestedValue },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY }),
  })
}

export function useDismissRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      clientFetch(`/recommendations/${id}/dismiss`, { method: "PATCH" }),
    onSettled: () => qc.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY }),
  })
}
