"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { format, addDays } from "date-fns"
import {
  AlertCircle,
  CalendarOff,
  CalendarClock,
  ChefHat,
  Sparkles,
  Search,
  Wand2,
  RotateCcw,
  Calendar,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { DegradedBanner } from "@/components/ai/degraded-banner"
import { ClientFetchError } from "@/lib/api/fetch-client"
import {
  useProductionPlan,
  useRecordActuals,
} from "@/features/production-plan/hooks/use-production-plan"
import {
  MAX_HORIZON_DAYS,
  getProductId,
  type ProductionPlanItem,
  type RecordActualsInput,
  type RecordActualsResponse,
} from "@/features/production-plan/api/type"
import { ActualsRow, type RowSaveStatus } from "./actuals-row"

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd")
}

function tomorrowStr(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd")
}

function horizonCapDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + MAX_HORIZON_DAYS)
  return d
}

const DEBOUNCE_MS = 800
const QTY_MAX = 1_000_000

function toQty(raw: string | undefined): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, QTY_MAX)
}

interface RowState {
  value: string
  status: RowSaveStatus
  error?: string
  retryable?: boolean
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2 rounded-lg bg-muted/30 p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  )
}

export function PlanTable() {
  const t = useTranslations("productionPlan")
  const tCommon = useTranslations("Common")
  const locale = useLocale()

  // Default to Tomorrow as production plans are target production for tomorrow/next shift
  const [date, setDate] = React.useState<string>(() => tomorrowStr())

  // Search & Filters State
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "pending" | "logged" | "targetMet"
  >("all")
  const [sortBy, setSortBy] = React.useState<
    "highestTarget" | "lowestTarget" | "name"
  >("highestTarget")

  const query = useProductionPlan(date)
  const recordActuals = useRecordActuals({
    appliedToast: (count) => t("actualsSaved", { count }),
    skippedToast: (count) => t("actualsSkipped", { count }),
    error: t("actualsError"),
  })

  const items = React.useMemo(() => query.data?.data.items ?? [], [query.data])

  // Per-row state
  const [rows, setRows] = React.useState<Record<string, RowState>>({})
  const dirtyRef = React.useRef<Set<string>>(new Set())
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushQueuedRef = React.useRef(false)
  const flushRef = React.useRef<() => void>(() => {})
  const lastHandledResultRef = React.useRef<RecordActualsResponse | undefined>(
    undefined
  )
  const lastHandledErrorRef = React.useRef<unknown>(undefined)

  // Re-seed row state from server data
  React.useEffect(() => {
    if (items.length === 0) return
    setRows((prev) => {
      const next = { ...prev }
      for (const item of items) {
        const id = getProductId(item)
        const existing = next[id]
        const isUserEditing =
          dirtyRef.current.has(id) ||
          existing?.status === "saving"
        if (!existing || !isUserEditing) {
          next[id] = {
            value:
              item.actualProducedQty != null
                ? String(item.actualProducedQty)
                : "",
            status: existing?.status === "saved" ? "saved" : "idle",
          }
        }
      }
      return next
    })
  }, [items])

  function flush() {
    if (recordActuals.isPending) {
      flushQueuedRef.current = true
      setRows((prev) => {
        const next = { ...prev }
        dirtyRef.current.forEach((id) => {
          if (next[id] && next[id].status !== "saving") {
            next[id] = { ...next[id], status: "saving" }
          }
        })
        return next
      })
      return
    }
    const ids = Array.from(dirtyRef.current)
    if (ids.length === 0) return

    const payload: RecordActualsInput = {
      date,
      items: ids.map((id) => ({
        productId: id,
        actualProducedQty: toQty(rows[id]?.value),
      })),
    }

    ids.forEach((id) => dirtyRef.current.delete(id))
    setRows((prev) => {
      const next = { ...prev }
      ids.forEach((id) => {
        next[id] = { ...next[id], status: "saving", error: undefined }
      })
      return next
    })

    recordActuals.mutate(payload)
  }

  React.useEffect(() => {
    flushRef.current = flush
  })

  React.useEffect(() => {
    const result = recordActuals.data
    if (!result || result === lastHandledResultRef.current) return
    lastHandledResultRef.current = result
    const variables = recordActuals.variables
    const submittedIds = variables?.items.map((i) => i.productId) ?? []
    const skippedSet = new Set(result.skipped)
    setRows((prev) => {
      const next = { ...prev }
      for (const id of submittedIds) {
        if (skippedSet.has(id)) {
          next[id] = {
            ...next[id],
            status: "failed",
            error: t("rowSkipped"),
            retryable: false,
          }
        } else {
          next[id] = {
            ...next[id],
            status: "saved",
            error: undefined,
            retryable: false,
          }
        }
      }
      return next
    })
  }, [recordActuals.data, recordActuals.variables, t])

  React.useEffect(() => {
    const err = recordActuals.error
    if (!err || err === lastHandledErrorRef.current) return
    lastHandledErrorRef.current = err
    const variables = recordActuals.variables
    const submittedIds = variables?.items.map((i) => i.productId) ?? []
    setRows((prev) => {
      const next = { ...prev }
      for (const id of submittedIds) {
        next[id] = {
          ...next[id],
          status: "failed",
          error: t("saveFailed"),
          retryable: true,
        }
        dirtyRef.current.add(id)
      }
      return next
    })
  }, [recordActuals.error, recordActuals.variables, t])

  React.useEffect(() => {
    if (!recordActuals.isPending && flushQueuedRef.current) {
      flushQueuedRef.current = false
      flushRef.current()
    }
  }, [recordActuals.isPending])

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleRetry(productId: string) {
    dirtyRef.current.add(productId)
    flushRef.current()
  }

  function handleChange(productId: string, raw: string) {
    dirtyRef.current.add(productId)
    setRows((prev) => ({
      ...prev,
      [productId]: {
        value: raw,
        status: prev[productId]?.status === "saving" ? "saving" : "idle",
      },
    }))
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      flushRef.current()
    }, DEBOUNCE_MS)
  }

  function handleBlur() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    flushRef.current()
  }

  // Action: Fill All items with AI Target
  function handleFillAllWithAi() {
    setRows((prev) => {
      const next = { ...prev }
      for (const item of items) {
        const id = getProductId(item)
        const recVal = String(item.recommendedQty ?? 0)
        next[id] = {
          value: recVal,
          status: "idle",
        }
        dirtyRef.current.add(id)
      }
      return next
    })

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      flushRef.current()
    }, 100)
  }

  // Filtered & Sorted items
  const processedItems = React.useMemo(() => {
    return items
      .filter((item) => {
        const id = getProductId(item)
        const product =
          typeof item.productId === "string" ? null : item.productId
        const title = product?.title ?? ""
        const rowVal = rows[id]?.value
        const actualNum =
          rowVal !== undefined && rowVal !== "" ? Number(rowVal) : null

        // Search match
        if (searchQuery.trim() !== "") {
          if (!title.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
            return false
          }
        }

        // Status Filter
        if (statusFilter === "pending") {
          return actualNum == null || actualNum === 0
        }
        if (statusFilter === "logged") {
          return actualNum != null && actualNum > 0
        }
        if (statusFilter === "targetMet") {
          return actualNum != null && actualNum >= (item.recommendedQty ?? 0)
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === "highestTarget") {
          return (b.recommendedQty ?? 0) - (a.recommendedQty ?? 0)
        }
        if (sortBy === "lowestTarget") {
          return (a.recommendedQty ?? 0) - (b.recommendedQty ?? 0)
        }
        if (sortBy === "name") {
          const titleA =
            typeof a.productId === "string" ? "" : (a.productId?.title ?? "")
          const titleB =
            typeof b.productId === "string" ? "" : (b.productId?.title ?? "")
          return titleA.localeCompare(titleB)
        }
        return 0
      })
  }, [items, rows, searchQuery, statusFilter, sortBy])

  const error = query.error as (ClientFetchError & { name?: string }) | null
  const status = error?.status
  const isTimeout =
    error?.name === "TimeoutError" || error?.name === "AbortError"

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-linear-to-r from-card via-card to-primary/5 p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                AI Demand Forecasting
              </span>
              {recordActuals.isPending ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <RotateCcw className="size-3 animate-spin" />
                  {tCommon("saving")}
                </span>
              ) : null}
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          {/* Date Selector & Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex rounded-xl border border-border bg-muted/40 p-1 shadow-2xs">
              <Button
                variant={date === tomorrowStr() ? "default" : "ghost"}
                size="sm"
                onClick={() => setDate(tomorrowStr())}
                className="h-8 rounded-lg text-xs font-medium"
              >
                <Calendar className="mr-1 size-3.5" />
                {t("tomorrow")}
              </Button>
              <Button
                variant={date === todayStr() ? "default" : "ghost"}
                size="sm"
                onClick={() => setDate(todayStr())}
                className="h-8 rounded-lg text-xs font-medium"
              >
                {t("today")}
              </Button>
            </div>

            <div className="w-44">
              <DatePicker
                value={date}
                onChange={(value) => value && setDate(value)}
                placeholder={t("datePlaceholder")}
                maxDate={horizonCapDate()}
              />
            </div>
          </div>
        </div>
      </div>

      {query.data?.degraded ? (
        <DegradedBanner reason={query.data.degradedReason} />
      ) : null}

      {/* Filter, Search & Batch Actions Bar */}
      {query.isSuccess && items.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="h-9 pl-9 text-xs"
            />
          </div>

          {/* Filter Pills & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/30 p-1">
              <Button
                variant={statusFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-7 rounded-md px-2.5 text-xs font-medium"
              >
                {t("filters.all")}
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className="h-7 rounded-md px-2.5 text-xs font-medium"
              >
                {t("filters.pending")}
              </Button>
              <Button
                variant={statusFilter === "logged" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("logged")}
                className="h-7 rounded-md px-2.5 text-xs font-medium"
              >
                {t("filters.logged")}
              </Button>
              <Button
                variant={statusFilter === "targetMet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("targetMet")}
                className="h-7 rounded-md px-2.5 text-xs font-medium"
              >
                {t("filters.targetMet")}
              </Button>
            </div>

            {/* Quick Batch Fill button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFillAllWithAi}
              className="h-9 gap-1.5 rounded-lg border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10"
              title={t("actions.fillAllAi")}
            >
              <Wand2 className="size-3.5" />
              <span>{t("actions.fillAllAi")}</span>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Main Grid View */}
      {query.isPending ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {t("generatingHint")}
          </p>
        </div>
      ) : status === 404 ? (
        <EmptyState
          icon={CalendarOff}
          title={t("noPlanTitle")}
          description={t("noPlanDescription")}
        />
      ) : status === 400 ? (
        <EmptyState
          icon={CalendarClock}
          title={t("horizonCapTitle")}
          description={t("horizonCapDescription", { days: MAX_HORIZON_DAYS })}
        />
      ) : query.isError ? (
        <EmptyState
          icon={AlertCircle}
          title={isTimeout ? t("generationTimeoutTitle") : t("fetchErrorTitle")}
          description={
            isTimeout ? t("generationTimeoutDescription") : t("fetchError")
          }
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              {t("retry")}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={t("noPlanTitle")}
          description={t("noPlanDescription")}
        />
      ) : processedItems.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t("noSearchMatch")}
          description="Try adjusting your search terms or filters."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processedItems.map((item: ProductionPlanItem) => {
            const id = getProductId(item)
            const row = rows[id] ?? {
              value: "",
              status: "idle" as RowSaveStatus,
            }
            return (
              <ActualsRow
                key={id}
                item={item}
                locale={locale}
                value={row.value}
                status={row.status}
                errorMessage={row.error}
                onRetry={row.retryable ? () => handleRetry(id) : undefined}
                onChange={(raw) => handleChange(id, raw)}
                onBlur={handleBlur}
              />
            )
          })}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {recordActuals.isPending ? tCommon("saving") : ""}
      </p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
