"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { format } from "date-fns"
import { AlertCircle, CalendarOff, CalendarClock, ChefHat } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatQty } from "@/lib/charts/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
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

function horizonCapDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + MAX_HORIZON_DAYS)
  return d
}

/** Debounce window before an edited row is included in a batch save; a blur
 * flushes immediately regardless of this timer (brief, Step 2). */
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
  /** True only for a `failed` row caused by a network/5xx failure — a
   * `skipped` row (rejected by the backend because it's no longer part of
   * the plan) has no retry affordance since resubmitting would just be
   * skipped again. Drives whether `ActualsRow` shows the retry button. */
  retryable?: boolean
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-11 flex-1" />
      </div>
    </div>
  )
}

/**
 * Daily production plan — the primary screen is a data-entry list a kitchen
 * worker fills in one-handed, not a report a manager scans. Client-owns:
 * the date filter, the debounce/batch/save-state machine for the "actual
 * produced" inputs, and the three non-happy-path date states (Step 4).
 */
export function PlanTable() {
  const t = useTranslations("productionPlan")
  const tCommon = useTranslations("Common")
  const locale = useLocale()

  const [date, setDate] = React.useState<string>(() => todayStr())

  const query = useProductionPlan(date)
  const recordActuals = useRecordActuals({
    appliedToast: (count) => t("actualsSaved", { count }),
    skippedToast: (count) => t("actualsSkipped", { count }),
    error: t("actualsError"),
  })

  const items = React.useMemo(() => query.data?.data.items ?? [], [query.data])

  // --- per-row state: value / save status, keyed by productId ------------
  const [rows, setRows] = React.useState<Record<string, RowState>>({})
  // Mutable bookkeeping (never triggers a render by itself) so the debounce
  // timer and the flush it eventually calls always see the LATEST edits,
  // never a stale closure from the render that scheduled the timer.
  const dirtyRef = React.useRef<Set<string>>(new Set())
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set when a flush is requested while a batch is already in flight — see
  // the effect below that drains it once the mutation settles.
  const flushQueuedRef = React.useRef(false)
  // The debounce timer's setTimeout callback is scheduled once but may fire
  // long after a re-render replaced `flush` with a version closing over
  // newer `rows` — indirecting through a ref that's reassigned every render
  // means the timer always invokes the CURRENT flush, not the one that
  // existed when the timer was scheduled.
  const flushRef = React.useRef<() => void>(() => {})
  const lastHandledResultRef = React.useRef<RecordActualsResponse | undefined>(
    undefined
  )
  const lastHandledErrorRef = React.useRef<unknown>(undefined)

  // Re-seed row state from server data — but only for rows that aren't
  // being actively edited (still within their debounce window, i.e. dirty)
  // or mid-save right now. A refetch (after invalidate, or a plain remount)
  // must never stomp an in-progress edit.
  React.useEffect(() => {
    if (items.length === 0) return
    setRows((prev) => {
      const next = { ...prev }
      for (const item of items) {
        const id = getProductId(item)
        const existing = next[id]
        if (
          !existing ||
          (!dirtyRef.current.has(id) && existing.status !== "saving")
        ) {
          next[id] = {
            value:
              item.actualProducedQty != null
                ? String(item.actualProducedQty)
                : "",
            status: "idle",
          }
        }
      }
      return next
    })
  }, [items])

  function flush() {
    if (recordActuals.isPending) {
      flushQueuedRef.current = true
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

  // Keeps `flushRef` pointed at the latest `flush` closure (current `rows`,
  // current `date`, current mutation) after every render. This runs as an
  // effect — not a direct `flushRef.current = flush` in the render body —
  // because writing a ref during render is a lint error here (refs are for
  // effects/handlers, not render output) and, more importantly, because a
  // React Compiler / concurrent-rendering environment may call the render
  // function speculatively without committing, which must never have a
  // side effect on shared mutable state.
  React.useEffect(() => {
    flushRef.current = flush
  })

  // Reconciles a successful batch against the exact rows it covered
  // (`recordActuals.variables`, the payload of the call that just
  // resolved) — never a per-call `mutate(vars, { onSuccess })`, which
  // TanStack drops when a later call supersedes the observer before the
  // earlier one resolves (see hook comment). Reading `.data`/`.variables`
  // reactively off the mutation object is immune to that: it's plain state,
  // not a callback registration.
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
          // A skipped productId wasn't part of the plan — retrying would
          // just be skipped again, so this row is NOT re-marked dirty and
          // gets no retry affordance (`retryable` stays unset).
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

  // Same identity-guarded pattern for a failed batch (network/5xx) — unlike
  // a `skipped` row, nothing here says the value itself was rejected, so
  // these rows go back into `dirtyRef` (a later flush — e.g. editing a
  // different row — will pick them up) AND get an explicit retry
  // affordance (`retryable: true`, see `handleRetry` below), since nothing
  // else on this screen otherwise re-triggers a flush for a row nobody
  // touches again. A kitchen worker shouldn't have to edit an unrelated
  // field to un-strand a failed entry.
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

  // Drains a flush that arrived while the previous batch was still in
  // flight (a second row edited mid-save, or the same row edited again).
  // This — not a per-call `mutate(vars, {...})` — is how a queued edit gets
  // sent: it runs once `isPending` flips back to false, picking up
  // whatever is in `dirtyRef` at that moment, which may include rows the
  // just-settled batch already covered (re-dirtied by a newer edit) as
  // well as rows that never got a chance to flush at all.
  //
  // Declared AFTER both reconciliation effects above, not before — same
  // commit, same-phase effects run in declaration order, so this ordering
  // is load-bearing: it guarantees the reconciliation effects always get
  // to react to a *just-settled* batch's outcome before this one
  // potentially fires the *next* batch and flips a row back to "saving".
  // Getting this backwards was a real bug in an earlier version of this
  // file (caught in review): with the drain effect declared first, a row
  // edited again while its own submission was still in flight would
  // flash "saving" -> the queued flush's next POST -> then get stomped
  // back to "saved"/"failed" by the reconciliation effect reacting to the
  // FIRST, now-superseded response, even though a second POST for a
  // different value was already outstanding.
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

  /** Manual retry for a `failed` row caused by a network/5xx failure (brief
   * fix-round item 2). The row is already back in `dirtyRef` (the error
   * effect above put it there), so this just needs to trigger a flush now
   * instead of waiting for some other row to be edited. Deliberately a
   * manual, explicit action rather than an automatic re-flush: a silent
   * auto-retry loop against a persistently unreachable network would keep
   * firing POSTs with no visible feedback beyond a repeating toast, which
   * is worse on a kitchen tablet than a single visible "tap to retry" — and
   * it matches how a `skipped` row already surfaces as an inline,
   * worker-actionable state rather than an invisible background process. */
  function handleRetry(productId: string) {
    dirtyRef.current.add(productId)
    flushRef.current()
  }

  function handleChange(productId: string, raw: string) {
    setRows((prev) => ({
      ...prev,
      [productId]: {
        value: raw,
        // A row mid-save keeps showing "saving" until that call settles;
        // otherwise a fresh edit clears any stale "saved"/"failed" light.
        status: prev[productId]?.status === "saving" ? "saving" : "idle",
      },
    }))
    dirtyRef.current.add(productId)
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

  // --- date-state branching (brief, Step 4) -------------------------------
  const error = query.error as (ClientFetchError & { name?: string }) | null
  const status = error?.status
  const isTimeout =
    error?.name === "TimeoutError" || error?.name === "AbortError"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("date")}
            </label>
            <DatePicker
              value={date}
              onChange={(value) => value && setDate(value)}
              placeholder={t("datePlaceholder")}
              maxDate={horizonCapDate()}
            />
          </div>
          {date !== todayStr() ? (
            <Button variant="outline" onClick={() => setDate(todayStr())}>
              {t("today")}
            </Button>
          ) : null}
        </div>
      </div>

      {query.data?.degraded ? (
        <DegradedBanner reason={query.data.degradedReason} />
      ) : null}

      {query.isSuccess && query.data.data.items.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("totalRecommended", {
            qty: formatQty(query.data.data.totalRecommendedQty, locale),
          })}
        </p>
      ) : null}

      {query.isPending ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item: ProductionPlanItem) => {
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
    <div
      className={cn(
        "flex h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-6 text-center"
      )}
    >
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
