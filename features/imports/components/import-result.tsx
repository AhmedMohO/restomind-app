"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  ChevronDown,
  CircleCheck,
  Download,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type {
  ConfirmImportResult,
  ImportRowError,
  ImportType,
} from "@/features/imports/api/type"
import { useRetryAiIngest } from "@/features/imports/hooks/use-imports"
import {
  classifyConfirmResult,
  classifyImportError,
  resolvePrerequisiteType,
  type ClassifiedImportFailure,
} from "@/features/imports/lib/errors"

export interface ImportResultProps {
  importType: ImportType
  /** The confirm response, when the mutation resolved (covers success, partial, failure, dependency violation, and ai_ingest_failed — all HTTP 200). */
  data?: ConfirmImportResult
  /** The thrown error, when upload or confirm itself failed (400/401/403/404/network). */
  error?: unknown
  /** Switches the type picker's selection to a prerequisite type after a dependency-order violation. */
  onSelectPrerequisite: (type: ImportType) => void
  /** Clears the mutation so the dropzone is ready for another attempt. */
  onDismiss: () => void
}

const PREVIEW_ROW_COUNT = 5
const MAX_EXPANDED_ROWS = 500

interface ErrorGroup {
  message: string
  rows: ImportRowError[]
}

function groupErrorsByMessage(errors: ImportRowError[]): ErrorGroup[] {
  const map = new Map<string, ImportRowError[]>()
  for (const e of errors) {
    const list = map.get(e.message)
    if (list) list.push(e)
    else map.set(e.message, [e])
  }
  return Array.from(map.entries())
    .map(([message, rows]) => ({ message, rows }))
    .sort((a, b) => b.rows.length - a.rows.length)
}

function downloadFailedRowsCsv(errors: ImportRowError[], filePrefix: string) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [
    ["row", "column", "message"].join(","),
    ...errors.map((e) =>
      [String(e.row), e.column ?? "", e.message].map(escape).join(",")
    ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filePrefix}-failed-rows.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ErrorGroupRow({ group }: { group: ErrorGroup }) {
  const t = useTranslations("imports")
  const [open, setOpen] = React.useState(false)

  const previewRows = group.rows.slice(0, PREVIEW_ROW_COUNT).map((r) => r.row)
  const remaining = group.rows.length - previewRows.length
  const expandedRows = group.rows.slice(0, MAX_EXPANDED_ROWS)
  const isCapped = group.rows.length > MAX_EXPANDED_ROWS

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-border"
    >
      <CollapsibleTrigger className="flex min-h-11 w-full items-start justify-between gap-3 p-3 text-start">
        <span className="space-y-0.5">
          <span className="block text-xs font-medium text-foreground">
            {group.message}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            {t("errors.occurrences", { count: group.rows.length })}
            {" · "}
            {t("errors.firstRows", {
              rows: previewRows.map((r) => String(r)).join(", "),
            })}
            {remaining > 0
              ? ` ${t("errors.andMore", { count: remaining })}`
              : null}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge variant="outline">
            <bdi dir="ltr">{group.rows.length}</bdi>
          </Badge>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border p-3">
        <ul className="grid grid-cols-4 gap-1.5 text-[11px] text-muted-foreground tabular-nums sm:grid-cols-8">
          {expandedRows.map((r, i) => (
            <li key={i}>
              <bdi dir="ltr">{r.row}</bdi>
            </li>
          ))}
        </ul>
        {isCapped ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("errors.capNotice", {
              cap: MAX_EXPANDED_ROWS,
              total: group.rows.length,
            })}
          </p>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/** The row-error list (brief Step 4): grouped by message, capped, with a CSV export of just the failed rows. */
function ErrorGroupList({
  errors,
  fileNamePrefix,
}: {
  errors: ImportRowError[]
  fileNamePrefix: string
}) {
  const t = useTranslations("imports")
  const groups = React.useMemo(() => groupErrorsByMessage(errors), [errors])

  if (groups.length === 0) return null

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">
          {t("errors.groupTitle")}
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadFailedRowsCsv(errors, fileNamePrefix)}
        >
          <Download className="size-3.5" />
          {t("errors.downloadCsv")}
        </Button>
      </div>
    </div>
  )
}

const FAILURE_MESSAGE_KEY: Record<ClassifiedImportFailure["kind"], string> = {
  "empty-file": "failure.emptyFile",
  "no-data-rows": "failure.noDataRows",
  "file-required": "failure.fileRequired",
  auth: "failure.auth",
  network: "failure.network",
  "not-found": "failure.notFound",
  "already-completed": "failure.alreadyCompleted",
  generic: "failure.generic",
}

function ThrownErrorBanner({
  classified,
  onDismiss,
}: {
  classified: ClassifiedImportFailure
  onDismiss: () => void
}) {
  const t = useTranslations("imports")

  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{t("result.failedTitle")}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{t(FAILURE_MESSAGE_KEY[classified.kind])}</p>
        {classified.kind === "generic" && classified.message ? (
          <p className="text-[11px] text-destructive/70">
            {classified.message}
          </p>
        ) : null}
        <Button size="sm" variant="outline" onClick={onDismiss}>
          {t("failure.retryButton")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Renders whatever happened to the last upload+confirm attempt (brief Steps
 * 3-5): a thrown HTTP/network error, or a resolved confirm body that itself
 * encodes success, partial success, total failure, a dependency-order
 * violation, or a saved-but-not-ingested sales_history job.
 *
 * The `ai_ingest_failed` case deliberately does NOT reuse the `failed`
 * destructive styling — the rows ARE saved (`importedCount > 0`), only the
 * background AI step failed, and rendering it as a generic failure would
 * send the manager to re-upload and double their data (the exact bug the
 * brief calls out).
 */
export function ImportResult({
  importType,
  data,
  error,
  onSelectPrerequisite,
  onDismiss,
}: ImportResultProps) {
  const t = useTranslations("imports")

  const retryMutation = useRetryAiIngest({
    success: t("result.retrySuccess"),
    error: t("result.retryError"),
  })

  if (error) {
    return (
      <ThrownErrorBanner
        classified={classifyImportError(error)}
        onDismiss={onDismiss}
      />
    )
  }

  if (!data) return null

  const outcome = classifyConfirmResult(data)

  if (outcome === "dependency-violation") {
    const message = data.errors[0]?.message ?? ""
    const prerequisiteType = resolvePrerequisiteType(message)
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>{t("result.dependencyTitle")}</AlertTitle>
        <AlertDescription className="space-y-2">
          {/* Rendered verbatim from the backend — do not paraphrase. */}
          <p>{message}</p>
          {prerequisiteType ? (
            <Button
              variant="link"
              className="h-auto p-0 text-destructive"
              onClick={() => onSelectPrerequisite(prerequisiteType)}
            >
              {t("result.goTo", { type: t(`types.${prerequisiteType}.title`) })}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }

  if (outcome === "ai-ingest-failed") {
    return (
      <div className="space-y-3">
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>{t("result.aiIngestFailedTitle")}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {t("result.aiIngestFailedBody", { count: data.importedCount })}
            </p>
            {data.aiIngestLastError ? (
              <p className="rounded bg-amber-500/10 p-2 font-mono text-[11px]">
                {t("result.aiIngestError")}: {data.aiIngestLastError}
              </p>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate(data.importJobId)}
            >
              {retryMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {retryMutation.isPending
                ? t("result.retrying")
                : t("result.retryAiIngest")}
            </Button>
          </AlertDescription>
        </Alert>
        {data.invalidRows > 0 ? (
          <ErrorGroupList errors={data.errors} fileNamePrefix={importType} />
        ) : null}
      </div>
    )
  }

  if (outcome === "success") {
    return (
      <Alert>
        <CircleCheck className="text-primary" />
        <AlertTitle>{t("result.successTitle")}</AlertTitle>
        <AlertDescription>
          {t("result.successBody", { count: data.importedCount })}
        </AlertDescription>
      </Alert>
    )
  }

  if (outcome === "partial") {
    return (
      <div className="space-y-3">
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>{t("result.partialTitle")}</AlertTitle>
          <AlertDescription>
            {t("result.partialBody", {
              valid: data.validRows,
              total: data.totalRows,
              invalid: data.invalidRows,
            })}
          </AlertDescription>
        </Alert>
        <ErrorGroupList errors={data.errors} fileNamePrefix={importType} />
      </div>
    )
  }

  // outcome === "failed"
  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>{t("result.failedTitle")}</AlertTitle>
        <AlertDescription>
          {t("result.failedBody", { invalid: data.invalidRows })}
        </AlertDescription>
      </Alert>
      <ErrorGroupList errors={data.errors} fileNamePrefix={importType} />
    </div>
  )
}
