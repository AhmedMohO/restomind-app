import type {
  ConfirmImportResult,
  ImportType,
} from "@/features/imports/api/type"

/**
 * Distinguishes which leg of the chained upload+confirm call failed (see
 * `useImportUpload` in `features/imports/hooks/use-imports.ts`). A confirm
 * failure means the job WAS created — it's visible in the history table
 * below — while an upload failure means nothing was written at all. That
 * distinction is what the network-failure message ("check history before
 * re-uploading") depends on.
 */
export class ImportFlowError extends Error {
  constructor(
    public readonly stage: "upload" | "confirm",
    public readonly cause: unknown,
    public readonly importJobId?: string
  ) {
    super(cause instanceof Error ? cause.message : String(cause))
    this.name = "ImportFlowError"
  }
}

export type ImportFailureKind =
  | "empty-file"
  | "no-data-rows"
  | "file-required"
  | "auth"
  | "network"
  | "not-found"
  | "already-completed"
  | "generic"

export interface ClassifiedImportFailure {
  kind: ImportFailureKind
  /** Raw backend/error message, for a verbatim fallback display. */
  message: string
  stage?: "upload" | "confirm"
}

/**
 * Classifies an actually-thrown mutation error (a non-2xx HTTP response, a
 * network failure, or a timeout) per the brief's Step 3 failure table.
 * Deliberately does NOT handle the "dependency violation" or
 * "ai_ingest_failed" cases — those are 200 responses with an informative
 * body, not thrown errors; see `classifyConfirmResult` below.
 */
export function classifyImportError(err: unknown): ClassifiedImportFailure {
  const stage = err instanceof ImportFlowError ? err.stage : undefined
  const inner: unknown = err instanceof ImportFlowError ? err.cause : err

  const status = (inner as { status?: unknown } | null)?.status
  const rawMessage =
    inner instanceof Error
      ? inner.message
      : typeof inner === "string"
        ? inner
        : ""

  // No numeric HTTP status at all means the request never got a response —
  // network down, DNS failure, or an AbortSignal.timeout() firing.
  if (typeof status !== "number") {
    return { kind: "network", message: rawMessage, stage }
  }

  if (status === 401 || status === 403) {
    return { kind: "auth", message: rawMessage, stage }
  }
  if (status === 404) {
    return { kind: "not-found", message: rawMessage, stage }
  }
  if (status === 400) {
    const lower = rawMessage.toLowerCase()
    if (lower.includes("csv file is empty")) {
      return { kind: "empty-file", message: rawMessage, stage }
    }
    if (lower.includes("no data rows")) {
      return { kind: "no-data-rows", message: rawMessage, stage }
    }
    if (lower.includes("csv file is required")) {
      return { kind: "file-required", message: rawMessage, stage }
    }
    if (lower.includes("already completed")) {
      return { kind: "already-completed", message: rawMessage, stage }
    }
  }

  return { kind: "generic", message: rawMessage, stage }
}

export type ConfirmOutcome =
  "dependency-violation" | "ai-ingest-failed" | "success" | "partial" | "failed"

/**
 * Classifies a successful (HTTP 200) `confirm` response body. The backend
 * encodes a dependency-order violation as a normal 200 with `validRows: 0`
 * and a single `row: 0` sentinel error (`ImportsService.confirmImport`,
 * e.g. the recipes branch) rather than throwing — real per-row validation
 * errors are always `row >= 2` (1-indexed from the header row), so `row ===
 * 0` combined with exactly one error is an unambiguous guard signal, not a
 * coincidence of a 1-row file.
 */
export function classifyConfirmResult(
  data: ConfirmImportResult
): ConfirmOutcome {
  const isDependencyViolation =
    data.validRows === 0 && data.errors.length === 1 && data.errors[0].row === 0

  if (isDependencyViolation) return "dependency-violation"
  if (data.status === "ai_ingest_failed") return "ai-ingest-failed"
  if (data.validRows > 0 && data.invalidRows === 0) return "success"
  if (data.validRows > 0 && data.invalidRows > 0) return "partial"
  return "failed"
}

/**
 * Resolves the prerequisite type a dependency-violation message points at,
 * so the UI can offer a one-click "go to {type}" action. Matches on the
 * exact phrasing `ImportsService.confirmImport` emits for each guard
 * ("...before onboarding menu items..." / "...before onboarding
 * ingredients...") — the displayed message itself is still rendered
 * verbatim from `data.errors[0].message`; this only picks the link target.
 */
export function resolvePrerequisiteType(message: string): ImportType | null {
  const lower = message.toLowerCase()
  if (lower.includes("menu items")) return "menu_items"
  if (lower.includes("ingredients")) return "ingredients"
  return null
}
