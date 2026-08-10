"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString, getErrorMessage } from "@/lib/api/utils"
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
    mutationKey: ["scan-surplus"],
    mutationFn: async () =>
      (await clientFetch("/recommendations/scan-surplus", {
        method: "POST",
        signal: AbortSignal.timeout(35_000),
      }))!,
    // Invalidate on BOTH paths: the backend commits waste reports before the
    // AI call, so a degraded scan still changed data.
    onSettled: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY }),
        qc.invalidateQueries({ queryKey: ["waste-reports"] }),
      ])
    },
  })
}

// Translated strings for the outcomes of an approve attempt. There is no
// existing precedent in this codebase for calling useTranslations()/
// getTranslations() from inside a hook (grepped every features/**/hooks
// file — none import next-intl), so rather than invent a new mechanism
// here, the calling component resolves these via useTranslations and
// passes the strings in. See recommendation-list.tsx.
export interface ApproveRecommendationMessages {
  success: string
  conflict: string
  invalid: string
  notFound: string
  generic: string
}

export function useApproveRecommendation(messages: ApproveRecommendationMessages) {
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
    // Mutation-level (not per-call) so a second approve firing before the
    // first settles can't discard this callback — TanStack Query drops
    // per-call mutate() options when a later call supersedes the observer.
    onSuccess: () => toast.success(messages.success),
    onError: (err: unknown, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
      const status = (err as { status?: number })?.status
      // These are distinct outcomes, not one generic failure.
      if (status === 409) toast.error(messages.conflict)
      else if (status === 400) toast.error(messages.invalid)
      else if (status === 404) toast.error(messages.notFound)
      else toast.error(messages.generic)
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY }),
        qc.invalidateQueries({ queryKey: ["offers"] }),
        qc.invalidateQueries({ queryKey: ["waste-reports"] }),
      ]),
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

export interface DismissRecommendationMessages {
  success: string
  error: string
}

export function useDismissRecommendation(messages: DismissRecommendationMessages) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      clientFetch(`/recommendations/${id}/dismiss`, { method: "PATCH" }),
    // Mutation-level, same reasoning as useApproveRecommendation above:
    // per-call onError here was previously the ONLY place dismiss errors
    // were reported, so a second dismiss superseding the first silently
    // swallowed the first dismiss's error toast entirely.
    onSuccess: () => toast.success(messages.success),
    onError: (err: unknown) => toast.error(getErrorMessage(err, messages.error)),
    onSettled: () => qc.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY }),
  })
}
