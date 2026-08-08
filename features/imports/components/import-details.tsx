"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  TriangleAlert,
  User,
  XCircle,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableState } from "@/components/ui/table-state"
import {
  type ImportJob,
  type ImportJobStatus,
} from "@/features/imports/api/type"
import {
  useImportJob,
  useRetryAiIngest,
} from "@/features/imports/hooks/use-imports"
import { ErrorGroupList } from "@/features/imports/components/import-result"

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

export function ImportDetails({ importJobId }: { importJobId: string }) {
  const t = useTranslations("imports")
  const locale = useLocale()

  const { data: job, isLoading, isError, refetch } = useImportJob(importJobId)

  const retryMutation = useRetryAiIngest({
    success: t("result.retrySuccess"),
    error: t("result.retryError"),
  })

  if (isLoading || isError || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/imports" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("details.title")}
          </h1>
        </div>
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && !isError && !job}
          onRetry={() => refetch()}
          errorText={t("history.fetchError")}
          retryText={t("history.retry")}
          emptyTitle={t("failure.notFound")}
        >
          <div className="h-48" />
        </TableState>
      </div>
    )
  }

  const canRetry =
    job.importType === "sales_history" && job.status === "ai_ingest_failed"

  const columnMappingEntries = job.columnMapping
    ? Object.entries(job.columnMapping)
    : []

  return (
    <div className="space-y-6">
      {/* Top Header Navigation & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/imports" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {job.fileName}
              </h1>
              <StatusChip status={job.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {t(`types.${job.importType}.title`)} • ID:{" "}
              <span className="font-mono text-xs">{job._id}</span>
            </p>
          </div>
        </div>

        {canRetry ? (
          <Button
            size="sm"
            variant="outline"
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate(job._id)}
          >
            {retryMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("result.retryAiIngest")}
          </Button>
        ) : null}
      </div>

      {/* Main Failure Reason Banner if job failed or contains failureReason */}
      {job.failureReason ? (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>{t("details.failureReason")}</AlertTitle>
          <AlertDescription className="mt-1 font-medium">
            {job.failureReason}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* AI Ingest Error Banner */}
      {job.aiIngestLastError ? (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertTitle>{t("result.aiIngestFailedTitle")}</AlertTitle>
          <AlertDescription className="mt-1 font-mono text-xs">
            {job.aiIngestLastError}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              {t("history.columns.rows")}
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {job.totalRows.toLocaleString(locale)}
            </div>
            <CardDescription className="text-xs">
              {t("uploadCard.description")}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              {t("result.successTitle")}
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {job.validRows.toLocaleString(locale)}
            </div>
            <CardDescription className="text-xs">
              {Math.round((job.validRows / (job.totalRows || 1)) * 100)}%{" "}
              {t("status.validated")}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              {t("errors.groupTitle")}
            </CardTitle>
            <XCircle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive tabular-nums">
              {job.invalidRows.toLocaleString(locale)}
            </div>
            <CardDescription className="text-xs">
              {job.errors?.length ?? 0} {t("errors.occurrences", { count: job.errors?.length ?? 0 })}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              {t("history.columns.time")}
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              <bdi dir="ltr">{formatDateTime(job.createdAt, locale)}</bdi>
            </div>
            <CardDescription className="text-xs flex items-center gap-1 mt-1">
              <User className="size-3" />
              {t("details.uploadedBy")}: <span className="font-mono">{job.uploadedBy.slice(-6)}</span>
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Column Mapping Section if present */}
      {columnMappingEntries.length > 0 ? (
        <Card className="shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("details.columnMapping")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("typePicker.expectedHeadersTitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">
                    {t("details.columnCsv")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("details.columnDb")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columnMappingEntries.map(([csvHeader, targetField]) => (
                  <TableRow key={csvHeader}>
                    <TableCell className="font-mono text-xs font-medium">
                      {csvHeader}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {targetField}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {/* Row Errors Section */}
      {job.errors && job.errors.length > 0 ? (
        <ErrorGroupList errors={job.errors} fileNamePrefix={job.importType} />
      ) : null}
    </div>
  )
}
