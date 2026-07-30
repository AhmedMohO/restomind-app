import {
  IMPORT_TYPES,
  type GetImportJobsParams,
  type ImportJobStatus,
  type ImportType,
} from "./type"

type ParseResult =
  { ok: true; params: GetImportJobsParams } | { ok: false; message: string }

const STATUSES: ImportJobStatus[] = [
  "processing",
  "validated",
  "ai_ingest_pending",
  "ai_ingest_failed",
  "completed",
  "failed",
]

/**
 * Validates at the BFF boundary so a malformed filter gets a 400 with detail
 * rather than an opaque upstream error. Mirrors
 * `features/recommendations/api/query.ts`.
 */
export function parseImportsQuery(sp: URLSearchParams): ParseResult {
  const params: GetImportJobsParams = {}

  const page = sp.get("page")
  if (page !== null) {
    const n = Number(page)
    if (!Number.isInteger(n) || n < 1)
      return { ok: false, message: "page must be a positive integer" }
    params.page = n
  }

  const limit = sp.get("limit")
  if (limit !== null) {
    const n = Number(limit)
    if (!Number.isInteger(n) || n < 1 || n > 100)
      return {
        ok: false,
        message: "limit must be an integer between 1 and 100",
      }
    params.limit = n
  }

  const importType = sp.get("importType")
  if (importType !== null) {
    if (!IMPORT_TYPES.includes(importType as ImportType))
      return {
        ok: false,
        message: `importType must be one of ${IMPORT_TYPES.join(", ")}`,
      }
    params.importType = importType as ImportType
  }

  const status = sp.get("status")
  if (status !== null) {
    if (!STATUSES.includes(status as ImportJobStatus))
      return {
        ok: false,
        message: `status must be one of ${STATUSES.join(", ")}`,
      }
    params.status = status as ImportJobStatus
  }

  return { ok: true, params }
}
