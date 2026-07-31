"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TablePagination } from "@/components/ui/table-pagination"
import { DegradedBanner } from "@/components/ai/degraded-banner"
import { useTableControls } from "@/hooks/use-table-controls"
import {
  useAiBackfill,
  useLearnedStatus,
} from "@/features/predictions/hooks/use-predictions"
import type { LearnedStatusItem } from "@/features/predictions/api/type"

/**
 * Per-product model training progress with status item filtering and
 * TablePagination. `data.degraded` means the status itself is a local guess
 * (the AI service that would confirm it is down) — `DegradedBanner` exists
 * precisely to say that out loud rather than present a guess as fact.
 */
export function LearningStatusStrip() {
  const t = useTranslations("predictions")
  const tAi = useTranslations("ai")
  const { data, isLoading } = useLearnedStatus()
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const { page, setPage, limit, setLimit } = useTableControls({ initialLimit: 5 })

  const backfillMutation = useAiBackfill({
    success: t("learning.backfillSuccess"),
    error: t("learning.backfillError"),
  })

  const handleStatusFilterChange = (val: string | null) => {
    if (val) {
      setStatusFilter(val)
      setPage(1)
    }
  }

  const items = data?.items
  const filteredItems = React.useMemo(() => {
    if (!items) return []
    if (statusFilter === "all") return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  const total = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  )

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("learning.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  const showBackfill =
    data.trainedCount === 0 && data.items.some((item) => item.salesRecordsCount > 0)

  const getStatusBadge = (status: LearnedStatusItem["status"]) => {
    switch (status) {
      case "trained":
        return (
          <Badge
            variant="outline"
            className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400"
          >
            {tAi(`status.${status}`)}
          </Badge>
        )
      case "learning":
        return (
          <Badge
            variant="outline"
            className="shrink-0 border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-700 dark:text-sky-400"
          >
            {tAi(`status.${status}`)}
          </Badge>
        )
      case "cold_start":
      default:
        return (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {tAi(`status.${status}`)}
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{t("learning.title")}</CardTitle>
          <p className="mt-1 font-heading text-lg font-semibold text-foreground">
            {t("learning.headline", {
              trained: data.trainedCount,
              total: data.totalProducts,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data.items.length > 0 && (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="learning-status-filter-select"
                className="cursor-pointer text-xs font-medium text-muted-foreground whitespace-nowrap"
              >
                {t("learning.statusFilter")}
              </Label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger
                  id="learning-status-filter-select"
                  aria-label={t("learning.statusFilter")}
                  className="h-8 w-[140px] text-xs"
                >
                  <SelectValue placeholder={t("learning.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("learning.allStatuses")}</SelectItem>
                  <SelectItem value="trained">{tAi("status.trained")}</SelectItem>
                  <SelectItem value="learning">{tAi("status.learning")}</SelectItem>
                  <SelectItem value="cold_start">{tAi("status.cold_start")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showBackfill ? (
            <Button
              size="sm"
              variant="outline"
              disabled={backfillMutation.isPending}
              onClick={() => backfillMutation.mutate(undefined)}
            >
              {backfillMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {backfillMutation.isPending
                ? t("learning.backfilling")
                : t("learning.backfillButton")}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.degraded ? <DegradedBanner reason={data.degradedReason} /> : null}

        {data.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("learning.empty")}</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("learning.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {paginatedItems.map((item) => {
              const pct = Math.round(
                Math.min(1, Math.max(0, item.progress)) * 100
              )
              return (
                <li
                  key={item.productId}
                  className="space-y-1.5 rounded-lg border border-border/50 bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-foreground">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {pct}%
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    aria-label={item.title}
                    className="h-2"
                  />
                </li>
              )
            })}
          </ul>
        )}

        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </CardContent>
    </Card>
  )
}

