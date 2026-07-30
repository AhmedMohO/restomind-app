"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString, getErrorMessage } from "@/lib/api/utils"
import {
  EMPTY_IMPORT_JOBS_PAGE,
  type ConfirmImportResult,
  type CreateImportResult,
  type GetImportJobsParams,
  type ImportJob,
  type ImportType,
  type PaginatedImportJobs,
} from "@/features/imports/api/type"
import { ImportFlowError } from "@/features/imports/lib/errors"

export const IMPORTS_QUERY_KEY = ["imports"] as const

/** GET /imports — recent job history (brief Step 6). */
export function useImportHistory(params: GetImportJobsParams = {}) {
  return useQuery<PaginatedImportJobs>({
    queryKey: [...IMPORTS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedImportJobs>(`/imports${qs}`)
      return res ?? EMPTY_IMPORT_JOBS_PAGE
    },
    staleTime: 30 * 1000,
    placeholderData: (previous) => previous,
  })
}

export type ImportStage = "idle" | "uploading" | "importing"

/**
 * Chains `POST /imports` (upload) -> `POST /imports/:id/confirm` (no
 * `columnMapping` — Step 1 of the brief: no manual mapping editor, the
 * backend's `autoSuggestMapping` stands) as a SINGLE mutation, so a failure
 * in either leg surfaces as one failed import rather than a half-finished
 * wizard.
 *
 * `stage` is plain `useState` updated synchronously *inside* `mutationFn`
 * (not a TanStack `onSuccess`/`onError` callback), so it's safe to read
 * from the component driving the two-stage progress element without
 * running into the per-call-callback-discard hazard documented in
 * `use-recommendations.ts` / `use-predictions.ts` — that hazard is specific
 * to callbacks TanStack itself defers and can drop when a later `mutate()`
 * supersedes the observer; this is just a synchronous assignment in the
 * function body that's already running.
 */
export function useImportUpload() {
  const qc = useQueryClient()
  const [stage, setStage] = React.useState<ImportStage>("idle")

  const mutation = useMutation<
    ConfirmImportResult,
    ImportFlowError,
    { file: File; importType: ImportType }
  >({
    mutationFn: async ({ file, importType }) => {
      setStage("uploading")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("importType", importType)

      let created: CreateImportResult
      try {
        created = (await clientFetch<CreateImportResult>("/imports", {
          method: "POST",
          body: formData,
        }))!
      } catch (err) {
        throw new ImportFlowError("upload", err)
      }

      setStage("importing")
      try {
        const confirmed = await clientFetch<ConfirmImportResult>(
          `/imports/${created.importJobId}/confirm`,
          { method: "POST" }
        )
        return confirmed!
      } catch (err) {
        throw new ImportFlowError("confirm", err, created.importJobId)
      }
    },
    // Mutation-level (not per-call `mutate(vars, {...})`) — a second drop
    // firing before the first settles must not discard this, same
    // reasoning as every other mutation hook in this plan.
    onSettled: () => {
      setStage("idle")
      qc.invalidateQueries({ queryKey: IMPORTS_QUERY_KEY })
    },
  })

  return { ...mutation, stage }
}

export interface RetryAiIngestMessages {
  success: string
  error: string
}

/**
 * POST /imports/:id/retry-ai-ingest — only meaningful for a `sales_history`
 * job stuck in `ai_ingest_failed` (brief Step 5). On success the job
 * becomes `completed` and the model has new data, so both the import
 * history and the predictions queries are invalidated.
 */
export function useRetryAiIngest(messages: RetryAiIngestMessages) {
  const qc = useQueryClient()
  return useMutation<ImportJob, unknown, string>({
    mutationFn: async (importJobId: string) =>
      (await clientFetch<ImportJob>(`/imports/${importJobId}/retry-ai-ingest`, {
        method: "POST",
      }))!,
    onSuccess: () => toast.success(messages.success),
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err, messages.error)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: IMPORTS_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["predictions"] })
    },
  })
}
