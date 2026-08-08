"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Eye, History, Loader2, RefreshCw } from "lucide-react"

import { Link, useRouter } from "@/i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { TableState } from "@/components/ui/table-state"
import { cn } from "@/lib/utils"
import { useTableControls } from "@/hooks/use-table-controls"
import {
  IMPORT_TYPES,
  type ImportJob,
  type ImportJobStatus,
  type ImportType,
} from "@/features/imports/api/type"
import {
  useImportHistory,
  useRetryAiIngest,
} from "@/features/imports/hooks/use-imports"

const ALL = "all"
const STATUSES: ImportJobStatus[] = [
  "processing",
  "validated",
  "ai_ingest_pending",
  "ai_ingest_failed",
  "completed",
  "failed",
]

const STATUS_STYLE: Record<ImportJobStatus, string> = {
  processing: "border-border text-muted-foreground",
  validated: "border-border text-muted-foreground",
  ai_ingest_pending: "border-amber-500/60 text-amber-700 dark:text-amber-400",
  ai_ingest_failed: "border-amber-500/60 text-amber-700 dark:text-amber-400",
  completed: "border-emerald-500/60 text-emerald-700 dark:text-emerald-400",
  failed: "border-destructive/60 text-destructive",
}

function formatDateTime(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function StatusChip({ status }: { status: ImportJobStatus }) {
  const t = useTranslations("imports")
  return (
    <Badge variant="outline" className={STATUS_STYLE[status]}>
      {t(`status.${status}`)}
    </Badge>
  )
}

function RowsCell({ job }: { job: ImportJob }) {
  const locale = useLocale()
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)
  return (
    <span className="tabular-nums">
      <bdi dir="ltr">
        {fmt(job.validRows)} / {fmt(job.totalRows)}
      </bdi>
    </span>
  )
}

function ImportHistoryRow({ job }: { job: ImportJob }) {
  const t = useTranslations("imports")
  const locale = useLocale()
  const router = useRouter()

  const retryMutation = useRetryAiIngest({
    success: t("result.retrySuccess"),
    error: t("result.retryError"),
  })

  const canRetry =
    job.importType === "sales_history" && job.status === "ai_ingest_failed"

  return (
    <TableRow
      className="cursor-pointer hover:bg-accent/40"
      onClick={() => router.push(`/dashboard/imports/${job._id}`)}
    >
      <TableCell className="text-start">
        <span
          className="block max-w-56 truncate font-medium text-foreground"
          title={job.fileName}
        >
          {job.fileName}
        </span>
      </TableCell>
      <TableCell className="text-start">
        {t(`types.${job.importType}.title`)}
      </TableCell>
      <TableCell className="text-start">
        <StatusChip status={job.status} />
      </TableCell>
      <TableCell className="text-end">
        <RowsCell job={job} />
      </TableCell>
      <TableCell className="text-end text-xs text-muted-foreground">
        <bdi dir="ltr">{formatDateTime(job.createdAt, locale)}</bdi>
      </TableCell>
      <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          {canRetry ? (
            <Button
              size="sm"
              variant="outline"
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate(job._id)}
            >
              {retryMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {t("result.retryAiIngest")}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/dashboard/imports/${job._id}`} aria-label={t("details.viewDetails")} />}
            className="size-8 p-0"
            title={t("details.viewDetails")}
          >
            <Eye className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

/**
 * Recent import jobs (brief Step 6) — how a manager answers "did that
 * upload actually work?" after navigating away, and the destination the
 * network-failure message points at ("check history before re-uploading").
 * Refetches on its own TanStack schedule; `useImportUpload`'s `onSettled`
 * also invalidates this query directly so a fresh run appears immediately.
 */
export function ImportHistory() {
  const t = useTranslations("imports")

  const [importType, setImportType] = React.useState<ImportType | "all">(ALL)
  const [status, setStatus] = React.useState<ImportJobStatus | "all">(ALL)
  const { page, setPage, limit, setLimit } = useTableControls({
    initialLimit: 10,
  })

  const { data, isLoading, isError, refetch } = useImportHistory({
    page,
    limit,
    importType: importType === ALL ? undefined : importType,
    status: status === ALL ? undefined : status,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const limitForPages = data?.limit ?? limit
  const totalPages =
    data?.totalPages ?? Math.max(1, Math.ceil(total / limitForPages))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("history.title")}
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="import-type-filter" className="text-xs font-semibold text-muted-foreground">
              {t("history.typeFilter")}
            </Label>
            <Select
              value={importType}
              onValueChange={(v) => {
                if (!v) return
                setImportType(v as ImportType | "all")
                setPage(1)
              }}
            >
              <SelectTrigger id="import-type-filter" className="w-44">
                <SelectValue placeholder={t("history.typeFilter")}>
                  {importType === ALL
                    ? t("history.typeFilter")
                    : t(`types.${importType}.title`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("history.typeFilter")}</SelectItem>
                {IMPORT_TYPES.map((it) => (
                  <SelectItem key={it} value={it}>
                    {t(`types.${it}.title`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="import-status-filter" className="text-xs font-semibold text-muted-foreground">
              {t("history.statusFilter")}
            </Label>
            <Select
              value={status}
              onValueChange={(v) => {
                if (!v) return
                setStatus(v as ImportJobStatus | "all")
                setPage(1)
              }}
            >
              <SelectTrigger id="import-status-filter" className="w-44">
                <SelectValue placeholder={t("history.statusFilter")}>
                  {status === ALL
                    ? t("history.statusFilter")
                    : t(`status.${status}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("history.statusFilter")}</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs"
        )}
      >
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={items.length === 0}
          onRetry={() => refetch()}
          errorText={t("history.fetchError")}
          retryText={t("history.retry")}
          emptyIcon={History}
          emptyTitle={t("history.empty")}
          emptyDescription={t("history.emptyHint")}
        >
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">
                  {t("history.columns.file")}
                </TableHead>
                <TableHead className="text-start">
                  {t("history.columns.type")}
                </TableHead>
                <TableHead className="text-start">
                  {t("history.columns.status")}
                </TableHead>
                <TableHead className="text-end">
                  {t("history.columns.rows")}
                </TableHead>
                <TableHead className="text-end">
                  {t("history.columns.time")}
                </TableHead>
                <TableHead className="text-end" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((job) => (
                <ImportHistoryRow key={job._id} job={job} />
              ))}
            </TableBody>
          </Table>
        </TableState>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  )
}
