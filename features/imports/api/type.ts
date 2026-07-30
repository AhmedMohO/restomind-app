/**
 * Types for the `/imports` endpoints, confirmed against
 * `imports.controller.ts` -> `imports.service.ts` in the sibling backend
 * repo (RestoMindAPI, read-only checkout) rather than assumed from the
 * brief. See `features/imports/api/index.ts` for the per-route envelope
 * notes (which routes wrap in `{ data }` vs which return the repository's
 * raw paginated shape).
 */

export type ImportType =
  | "menu_items"
  | "ingredients"
  | "recipes"
  | "inventory_transactions"
  | "sales_history"

/** Onboarding order — also the order the type picker renders in. */
export const IMPORT_TYPES: ImportType[] = [
  "menu_items",
  "ingredients",
  "recipes",
  "inventory_transactions",
  "sales_history",
]

export type ImportJobStatus =
  | "processing"
  | "validated"
  | "ai_ingest_pending"
  | "ai_ingest_failed"
  | "completed"
  | "failed"

/**
 * One row-level problem. `row: 0` is the backend's sentinel for a
 * dependency-order guard failure (e.g. "Cannot import recipes before
 * onboarding menu items…") rather than a real CSV row — real rows are
 * 1-indexed from the header, so the first data row is `row: 2`. See
 * `classifyConfirmResult` in `features/imports/lib/errors.ts`.
 */
export interface ImportRowError {
  row: number
  column?: string
  message: string
}

/** `POST /imports` (201) response body's `data`. */
export interface CreateImportResult {
  importJobId: string
  fileName: string
  importType: ImportType
  status: ImportJobStatus
  detectedHeaders: string[]
  suggestedMapping: Record<string, string>
  totalRows: number
}

/** `POST /imports/:id/confirm` response body's `data`. */
export interface ConfirmImportResult {
  importJobId: string
  status: ImportJobStatus
  totalRows: number
  validRows: number
  invalidRows: number
  errors: ImportRowError[]
  aiIngestLastError?: string
  importedCount: number
}

/** The persisted job document, as returned by `GET /imports/:id` and inside `GET /imports` list items. */
export interface ImportJob {
  _id: string
  restaurantId: string
  uploadedBy: string
  importType: ImportType
  fileName: string
  columnMapping?: Record<string, string>
  status: ImportJobStatus
  totalRows: number
  validRows: number
  invalidRows: number
  errors: ImportRowError[]
  aiIngestAttempts: number
  aiIngestLastError?: string
  createdAt: string
  updatedAt: string
}

/**
 * `GET /imports` — raw `{ items, page, limit, total, totalPages }`, no
 * `data` wrapper. `ImportsService.getImportJobs` returns
 * `importJobRepository.findManyPaginated(...)` straight through the
 * controller's `res.status(HttpStatus.OK).json(result)` — same shape as
 * `getRecommendations` / `getPredictions` in the sibling features.
 */
export interface PaginatedImportJobs {
  items: ImportJob[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetImportJobsParams {
  page?: number
  limit?: number
  importType?: ImportType
  status?: ImportJobStatus
}

export const EMPTY_IMPORT_JOBS_PAGE: PaginatedImportJobs = {
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
}
