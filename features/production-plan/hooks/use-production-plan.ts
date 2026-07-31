"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { clientFetch, ClientFetchError } from "@/lib/api/fetch-client"
import { getErrorMessage } from "@/lib/api/utils"
import type {
  ProductionPlanResponse,
  RecordActualsInput,
  RecordActualsResponse,
} from "@/features/production-plan/api/type"

export const PRODUCTION_PLAN_QUERY_KEY = ["production-plan"] as const

// Generation on a cold AI can take up to ~30s (brief, Step 4) — this leaves
// real headroom before the query gives up and the UI switches to a timeout
// message, rather than aborting mid-generation.
export const PRODUCTION_PLAN_TIMEOUT_MS = 45_000

/**
 * GET /predictions/production-plan?date=YYYY-MM-DD.
 *
 * `staleTime: 0`: today's (or a near-future date's) plan can be generated
 * server-side between one visit and the next — a cached "no plan yet" must
 * never survive a remount.
 *
 * `retry`: a 404 (no plan for a past date) and a 400 (beyond the 14-day
 * horizon) are real, final answers — retrying would either re-trigger an AI
 * generation attempt for a date that will never have a plan, or resubmit a
 * request the backend will reject again either way. Only genuine transient
 * failures (network blip, 5xx, timeout) get retried, and only twice.
 */
export function useProductionPlan(date: string) {
  return useQuery<ProductionPlanResponse>({
    queryKey: [...PRODUCTION_PLAN_QUERY_KEY, date],
    queryFn: async () =>
      (await clientFetch<ProductionPlanResponse>(
        `/predictions/production-plan?date=${encodeURIComponent(date)}`,
        { signal: AbortSignal.timeout(PRODUCTION_PLAN_TIMEOUT_MS) }
      ))!,
    enabled: Boolean(date),
    staleTime: 0,
    retry: (failureCount, error) => {
      const status = (error as ClientFetchError)?.status
      if (status === 404 || status === 400) return false
      return failureCount < 2
    },
  })
}

// Translated strings for a batch actuals save. No existing precedent in
// this codebase for calling useTranslations()/getTranslations() from inside
// a hook (see use-predictions.ts, use-recommendations.ts) — the calling
// component resolves these via useTranslations and passes them in.
export interface RecordActualsMessages {
  appliedToast: (count: number) => string
  skippedToast: (count: number) => string
  error: string
}

/**
 * POST /predictions/production-plan/actuals.
 *
 * Toasting lives here at the mutation level (not a per-call
 * `mutate(vars, {...})`) so it can never be silently dropped by TanStack
 * discarding a superseded call's callbacks — same reasoning as
 * `useApproveRecommendation`/`useDismissRecommendation`. Per-row save-state
 * reconciliation (idle/saving/saved/failed) is a separate concern and lives
 * in `plan-table.tsx`, driven reactively off this mutation's own `data` /
 * `variables` / `error`, never off a per-call callback either — see the
 * comment there for why.
 */
export function useRecordActuals(messages: RecordActualsMessages) {
  const qc = useQueryClient()
  return useMutation<RecordActualsResponse, unknown, RecordActualsInput>({
    mutationFn: async (vars) =>
      (await clientFetch<RecordActualsResponse>(
        "/predictions/production-plan/actuals",
        { method: "POST", body: vars }
      ))!,
    onSuccess: (result) => {
      // Never a bare success when part of the batch was silently dropped —
      // a productId in `skipped` wasn't part of the plan, and the manager
      // needs to know their entry for that row didn't land.
      if (result.skipped.length > 0) {
        toast.error(messages.skippedToast(result.skipped.length))
      } else if (result.applied.length > 0) {
        toast.success(messages.appliedToast(result.applied.length))
      }
    },
    onError: (err) => toast.error(getErrorMessage(err, messages.error)),
    onSettled: () => qc.invalidateQueries({ queryKey: PRODUCTION_PLAN_QUERY_KEY }),
  })
}
