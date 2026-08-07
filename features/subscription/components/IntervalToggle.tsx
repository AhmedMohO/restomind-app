"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import {
  BILLING_INTERVALS,
  type BillingInterval,
} from "@/features/plans/api/type"
import type { PlanOption } from "../api/type"

/**
 * Choose the commitment length before choosing a plan.
 *
 * Each option advertises the best saving available on it, so the incentive to
 * commit is visible before the merchant clicks — putting it only inside the
 * plan cards would hide it behind the choice it is meant to influence.
 */
export default function IntervalToggle({
  plans,
  value,
  onChange,
}: {
  plans: PlanOption[]
  value: BillingInterval
  onChange: (interval: BillingInterval) => void
}) {
  const t = useTranslations("Dashboard.billing")

  /** The largest saving any visible plan offers on this interval. */
  const bestSaving = (interval: BillingInterval): number | null => {
    const savings = plans
      .map((plan) => plan.intervals[interval]?.savingPercent ?? null)
      .filter((percent): percent is number => percent !== null && percent > 0)

    return savings.length > 0 ? Math.max(...savings) : null
  }

  /** An interval no plan sells is dead — do not offer it. */
  const isSold = (interval: BillingInterval) =>
    plans.some((plan) => plan.intervals[interval] !== null)

  const available = BILLING_INTERVALS.filter(isSold)

  // With only one interval on sale there is nothing to choose between.
  if (available.length <= 1) return null

  return (
    <div
      role="radiogroup"
      aria-label={t("billingPeriod")}
      className="bg-muted/50 mx-auto flex w-fit flex-wrap justify-center gap-1 rounded-2xl border p-1 shadow-xs"
    >
      {available.map((interval) => {
        const saving = bestSaving(interval)
        const active = interval === value

        return (
          <button
            key={interval}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(interval)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`interval.${interval}`)}
            {saving !== null && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  active
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-emerald-500/10 text-emerald-700/80 dark:text-emerald-400/80"
                )}
              >
                {t("savePercent", { percent: saving })}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
