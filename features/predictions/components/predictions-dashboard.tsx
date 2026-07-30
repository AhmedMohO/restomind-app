"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { useBatchRecalculate } from "@/features/predictions/hooks/use-predictions"
import { LearningStatusStrip } from "./learning-status-strip"
import { PredictionList } from "./prediction-list"
import { UnassignedShortfalls } from "./unassigned-shortfalls"

/** The next Sunday on or after today, in the app's local time zone. */
function nextSunday(): string {
  const now = new Date()
  const daysUntilSunday = (7 - now.getDay()) % 7
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilSunday
  )
  return format(target, "yyyy-MM-dd")
}

const TARGET_WEEK_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates an incoming `?targetWeek=` search param (Task 6's waste-report
 * "linked forecast" deep link lands here) before trusting it as the initial
 * filter — format-valid (YYYY-MM-DD) and an actually-parseable calendar
 * date. Deliberately does NOT require it to land on a Sunday: the value
 * comes from a real `Prediction.targetWeek` on the other end of that link,
 * and rejecting a real, already-generated prediction's week because it
 * doesn't match this screen's own Sunday-only *input* convention would
 * defeat the deep link for no safety reason — the query just returns
 * whatever `usePredictionsList` finds for that value, same as any other
 * `targetWeek`. Anything unparseable (missing, malformed, garbage query
 * string) falls back to `nextSunday()` rather than putting the screen in a
 * broken state.
 */
function parseTargetWeekParam(raw: string | null): string | null {
  if (!raw || !TARGET_WEEK_RE.test(raw)) return null
  const parsed = new Date(`${raw}T12:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : raw
}

/**
 * Top-level client state for the predictions page: the target-week filter,
 * the batch-recalculate mutation, and the polling switch that connects them.
 *
 * `isRecalculating` design: `useBatchRecalculate`'s POST is itself the
 * long-running operation (`maxDuration = 300` on the BFF route) — its
 * promise doesn't resolve until the whole batch is done or the request
 * times out, so `batchMutation.isPending` genuinely does span the whole
 * run. What the brief's "must not block on the POST for its UI state"
 * means in practice: don't gate the row list on that promise. Instead,
 * `isRecalculating` (= `batchMutation.isPending`) only toggles
 * `usePredictionsList`'s `refetchInterval` on/off (via `PredictionList`'s
 * `refetchInterval` prop), so the list re-polls every 5s *while* the POST
 * is still in flight and shows each product's prediction as soon as the
 * backend commits it — instead of the manager staring at one spinner for
 * however long the full batch takes. Polling stops the instant the
 * mutation settles (success or error) because `isPending` flips to
 * `false`; `onSettled` in the hook also invalidates the query once more so
 * the final page reconciles even if the last poll landed just before the
 * batch finished.
 *
 * `unassignedShortfalls` (Step 7) lives in `batchMutation.data` — TanStack
 * keeps a mutation's last resolved payload on the observer, so reading
 * `batchMutation.data?.unassignedShortfalls` needs no extra `useState` +
 * `onSuccess` side effect to mirror it. That also sidesteps the
 * per-call-callback-discard hazard entirely (see use-predictions.ts):
 * there's no callback in the path at all, just the mutation's own current
 * state, so a second "Recalculate all" superseding the first can't drop
 * anything silently. It resets to the new run's data once that resolves,
 * which is exactly "shortfalls from the last batch run".
 */
export function PredictionsDashboard() {
  const t = useTranslations("predictions")
  const searchParams = useSearchParams()
  // Lazy initializer — reads the URL only on first mount, so this seeds the
  // *initial* week from a deep link without disturbing normal in-page week
  // navigation afterwards (the DatePicker below still just calls
  // `setTargetWeek` directly, same as before this change).
  const [targetWeek, setTargetWeek] = React.useState<string>(
    () => parseTargetWeekParam(searchParams.get("targetWeek")) ?? nextSunday()
  )

  const batchMutation = useBatchRecalculate(targetWeek, {
    success: t("batchSuccess"),
    error: t("batchError"),
  })
  const isRecalculating = batchMutation.isPending
  const shortfalls = batchMutation.data?.unassignedShortfalls ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("targetWeek")}
            </label>
            <DatePicker
              value={targetWeek}
              onChange={(value) => value && setTargetWeek(value)}
              placeholder={t("targetWeekPlaceholder")}
              disabledMatcher={(date) => date.getDay() !== 0}
            />
          </div>

          <Button
            disabled={isRecalculating || !targetWeek}
            onClick={() => batchMutation.mutate()}
          >
            {isRecalculating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {isRecalculating ? t("recalculating") : t("recalculateAll")}
          </Button>
        </div>
      </div>

      {isRecalculating ? (
        <p className="text-xs text-muted-foreground">
          {t("recalculatingHint")}
        </p>
      ) : null}

      <LearningStatusStrip />

      <UnassignedShortfalls shortfalls={shortfalls} />

      {/* `key` forces a remount on a new target week so PredictionList's
          internal page/limit state (useTableControls) resets to page 1 —
          otherwise switching weeks while on page 3 would silently request
          page 3 of a result set that may not have one. */}
      <PredictionList
        key={targetWeek}
        targetWeek={targetWeek}
        refetchInterval={isRecalculating ? 5000 : false}
      />
    </div>
  )
}
