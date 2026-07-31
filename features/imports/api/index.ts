import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import {
  EMPTY_IMPORT_JOBS_PAGE,
  type ConfirmImportResult,
  type CreateImportResult,
  type GetImportJobsParams,
  type ImportJob,
  type PaginatedImportJobs,
} from "./type"

export * from "./type"

/**
 * POST /imports — multipart/form-data (`file` + `importType`). Wraps in
 * `{ data }`: `ImportsService.createImport` hand-builds
 * `{ data: { importJobId, ... } }` before the controller's
 * `res.status(HttpStatus.CREATED).json(result)`.
 */
export async function createImportJob(
  formData: FormData
): Promise<CreateImportResult> {
  const response = await apiClient("/imports", {
    method: "POST",
    body: formData,
  })
  const body = await parseOrThrow<{ data: CreateImportResult }>(
    response,
    "createImportJob"
  )
  return body.data
}

/**
 * POST /imports/:id/confirm — deliberately sent with NO body, so
 * `dto.columnMapping` is `undefined` and the service falls back to
 * `job.columnMapping` (the `autoSuggestMapping` result stored at upload
 * time). This is the whole point of Step 1: no manual mapping editor.
 * Wraps in `{ data }`, same as `createImportJob`.
 */
export async function confirmImportJob(
  importJobId: string
): Promise<ConfirmImportResult> {
  const response = await apiClient(`/imports/${importJobId}/confirm`, {
    method: "POST",
  })
  const body = await parseOrThrow<{ data: ConfirmImportResult }>(
    response,
    "confirmImportJob"
  )
  return body.data
}

/**
 * GET /imports — raw `{ items, page, limit, total, totalPages }`, no `data`
 * wrapper. See the type-level doc comment on `PaginatedImportJobs`.
 */
export async function getImportJobs(
  params: GetImportJobsParams = {}
): Promise<PaginatedImportJobs> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/imports${qs}`)
  const body = await parseOrThrow<PaginatedImportJobs>(
    response,
    "getImportJobs"
  )
  return body ?? EMPTY_IMPORT_JOBS_PAGE
}

/** GET /imports/:id — wraps in `{ data }`. */
export async function getImportJobById(
  importJobId: string
): Promise<ImportJob> {
  const response = await apiClient(`/imports/${importJobId}`)
  const body = await parseOrThrow<{ data: ImportJob }>(
    response,
    "getImportJobById"
  )
  return body.data
}

/** POST /imports/:id/retry-ai-ingest — wraps in `{ data }`. */
export async function retryAiIngest(importJobId: string): Promise<ImportJob> {
  const response = await apiClient(`/imports/${importJobId}/retry-ai-ingest`, {
    method: "POST",
  })
  const body = await parseOrThrow<{ data: ImportJob }>(
    response,
    "retryAiIngest"
  )
  return body.data
}
