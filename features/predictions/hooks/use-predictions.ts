"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString, getErrorMessage } from "@/lib/api/utils"
import {
  EMPTY_ACCURACY,
  EMPTY_LEARNED_STATUS,
  EMPTY_PREDICTIONS_PAGE,
  type Accuracy,
  type GetPredictionsParams,
  type LearnedStatus,
  type PaginatedPredictions,
} from "@/features/predictions/api/type"

export const PREDICTIONS_QUERY_KEY = ["predictions"] as const

export interface UsePredictionsListOptions {
  /**
   * Passed straight through to TanStack's `refetchInterval`. The page drives
   * this — truthy while a batch recalculation is in flight, `false` once it
   * settles — so a long-running batch surfaces finished rows as they land
   * instead of the UI staring at a single frozen spinner. See
   * `useBatchRecalculate` below.
   */
  refetchInterval?: number | false
}

export function usePredictionsList(
  params: GetPredictionsParams = {},
  options: UsePredictionsListOptions = {}
) {
  return useQuery<PaginatedPredictions>({
    queryKey: [...PREDICTIONS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedPredictions>(`/predictions${qs}`)
      return res ?? EMPTY_PREDICTIONS_PAGE
    },
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
    refetchInterval: options.refetchInterval ?? false,
    // TanStack v5 doesn't fire mutation-level callbacks after a component
    // unmounts (the observer unsubscribes), so navigating away mid-batch
    // drops both the toast and the final onSettled invalidateQueries.
    // Without this, returning within the 60s staleTime above would then
    // show pre-batch rows with no refetch. "always" forces a fresh fetch
    // on every mount regardless of staleTime, so a return visit always
    // reflects reality instead of a possibly-stale cache.
    refetchOnMount: "always",
  })
}

/** GET /predictions/learned-status — per-product model training progress. */
export function useLearnedStatus() {
  return useQuery<LearnedStatus>({
    queryKey: [...PREDICTIONS_QUERY_KEY, "learned-status"],
    queryFn: async () =>
      (await clientFetch<LearnedStatus>("/predictions/learned-status")) ??
      EMPTY_LEARNED_STATUS,
    staleTime: 60 * 1000,
  })
}

/** GET /predictions/accuracy — rolling MAPE per closed week. */
export function useAccuracy(weeks = 8) {
  return useQuery<Accuracy>({
    queryKey: [...PREDICTIONS_QUERY_KEY, "accuracy", weeks],
    queryFn: async () =>
      (await clientFetch<Accuracy>(`/predictions/accuracy?weeks=${weeks}`)) ??
      EMPTY_ACCURACY,
    staleTime: 5 * 60 * 1000,
  })
}

// Translated strings for a mutation's toast outcomes. There is no existing
// precedent in this codebase for calling useTranslations()/getTranslations()
// from inside a hook (see use-recommendations.ts) — the calling component
// resolves these via useTranslations and passes the strings in.
export interface RecalculatePredictionMessages {
  success: string
  error: string
}

/** POST /predictions/recalculate — recompute a single product/week forecast. */
export function useRecalculatePrediction(messages: RecalculatePredictionMessages) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { productId: string; targetWeek?: string }) =>
      clientFetch("/predictions/recalculate", {
        method: "POST",
        body: vars,
      }),
    // Mutation-level (not per-call `mutate(vars, {...})`) so a second
    // recalculate fired before the first settles can't discard this
    // callback — TanStack Query drops per-call mutate() options when a
    // later call supersedes the observer, which would silently swallow the
    // error toast. Same reasoning as Task 3's use-recommendations.ts.
    onSuccess: () => toast.success(messages.success),
    onError: (err: unknown) => toast.error(getErrorMessage(err, messages.error)),
    onSettled: () => qc.invalidateQueries({ queryKey: PREDICTIONS_QUERY_KEY }),
  })
}

/**
 * One ingredient the batch run needed but couldn't place an order for
 * because no supplier is assigned to it. Confirmed against the real backend
 * (`supplier-auto-draft.service.ts:233-239`) during code review: the shape
 * is `{ ingredientId, ingredientName, ingredientCode, shortfall, unit }`.
 * `batch-recalculate` replies `res.status(200).json(result)` raw, so this
 * sits at the top of the upstream body — `jsonSuccess(body.data ?? body)`
 * on the BFF route, then `clientFetch` unwrapping one `.data`, lands it
 * here correctly with no further nesting to account for.
 */
export interface UnassignedShortfall {
  ingredientId: string
  ingredientName: string
  ingredientCode: string
  unit: string
  shortfall: number
}

export interface BatchRecalculateResult {
  unassignedShortfalls: UnassignedShortfall[]
}

export interface BatchRecalculateMessages {
  success: string
  error: string
}

/**
 * Fires the batch recalculation and settles once the POST resolves — but
 * the page deliberately does NOT gate its UI on that. A batch over 50
 * products can run for minutes (`maxDuration = 300` on the BFF route), so
 * instead of a single frozen spinner for the whole request, the page polls
 * `usePredictionsList({ targetWeek })` on a 5s interval while
 * `isPending` is true here. The backend commits each product's prediction
 * as it finishes, so the polled list fills in row by row even though this
 * mutation's own promise won't resolve until the entire batch is done (or
 * the request times out). See task-4-report.md for the isRecalculating
 * wiring in predictions-dashboard.tsx.
 */
export function useBatchRecalculate(
  targetWeek?: string,
  messages?: BatchRecalculateMessages
) {
  const qc = useQueryClient()
  return useMutation<BatchRecalculateResult>({
    mutationFn: async () =>
      (await clientFetch<BatchRecalculateResult>(
        "/predictions/batch-recalculate",
        {
          method: "POST",
          body: { targetWeek },
          // `clientFetch` sets no default timeout, and the BFF route's
          // `maxDuration = 300` is a serverless hint a self-hosted Node
          // server ignores — without this, a stalled socket would leave
          // `isPending` (and the page's 5s poll + spinner) stuck forever.
          // Scoped to this one call, not a change to clientFetch's global
          // behaviour. 300s matches the BFF route's own budget so this
          // never fires *before* a legitimately long batch would finish.
          signal: AbortSignal.timeout(300_000),
        }
      ))!,
    onSuccess: () => {
      if (messages) toast.success(messages.success)
    },
    onError: (err: unknown) => {
      if (messages) toast.error(getErrorMessage(err, messages.error))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PREDICTIONS_QUERY_KEY }),
  })
}

export interface AiBackfillMessages {
  success: string
  error: string
}

/** POST /predictions/ai-backfill — seed sales history so training starts sooner. */
export function useAiBackfill(messages: AiBackfillMessages) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars?: { days?: number }) =>
      clientFetch("/predictions/ai-backfill", {
        method: "POST",
        body: { days: vars?.days },
      }),
    onSuccess: () => toast.success(messages.success),
    onError: (err: unknown) => toast.error(getErrorMessage(err, messages.error)),
    onSettled: () => qc.invalidateQueries({ queryKey: PREDICTIONS_QUERY_KEY }),
  })
}
