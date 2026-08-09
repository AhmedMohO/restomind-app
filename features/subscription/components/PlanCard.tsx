"use client"

import { useTranslations } from "next-intl"
import { Check, Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { BillingInterval } from "@/features/plans/api/type"
import type { PlanOption } from "../api/type"

/**
 * One plan, priced for the interval the merchant is currently looking at.
 *
 * Extracted from BillingWall when the interval axis was added — the card now
 * has to reason about a price that may not exist, a per-month equivalent and
 * a saving, and inlining all of that made the parent hard to follow.
 */
export default function PlanCard({
  plan,
  interval,
  selected,
  recommended,
  onSelect,
  t,
}: {
  plan: PlanOption
  interval: BillingInterval
  selected: boolean
  recommended: boolean
  onSelect: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const option = plan.intervals[interval]

  // A plan that does not sell this interval is shown greyed rather than
  // hidden: a card vanishing as you flick between intervals reads as a bug.
  const notSold = option === null
  const locked = notSold || !option.purchasable
  const selectable = !locked
  const isScale = plan.slug === "scale"

  return (
    <Card
      role="radio"
      aria-checked={selected}
      aria-disabled={locked}
      tabIndex={locked ? -1 : 0}
      onClick={() => selectable && onSelect()}
      onKeyDown={(event) => {
        if (!selectable) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "flex flex-col justify-between rounded-2xl p-5 shadow-xs transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        locked
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-foreground/30 hover:shadow-sm",
        selected &&
          "border-primary bg-primary/[0.03] shadow-md ring-2 ring-primary/20"
      )}
    >
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-foreground">
            {plan.label}
          </span>
          {plan.isCurrent ? (
            <Badge
              variant="secondary"
              className="border-emerald-600/20 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400"
            >
              {t("yourPlan")}
            </Badge>
          ) : (
            recommended && (
              <Badge
                variant="secondary"
                className="border-primary/20 bg-primary/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-primary uppercase"
              >
                {t("recommended")}
              </Badge>
            )
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        {notSold ? (
          <p className="py-2 text-base font-medium text-muted-foreground">
            {t("notSoldOnInterval")}
          </p>
        ) : (
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
              {/* The standard price, struck through, only when this merchant
                  is actually being charged less than it. */}
              {option.standardPriceEGP !== null && (
                <span className="me-2 text-xl font-semibold text-muted-foreground line-through sm:text-2xl">
                  {option.standardPriceEGP.toLocaleString()}
                </span>
              )}
              {option.priceEGP.toLocaleString()}
              <span className="ms-1.5 text-base font-normal text-muted-foreground">
                {t(`per.${interval}`)}
              </span>
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              {/* Per-month equivalent is what makes two intervals comparable;
                  without it a yearly figure just looks more expensive. */}
              {interval !== "monthly" && (
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {t("perMonthEquivalent", {
                    amount: option.perMonthEGP.toLocaleString(),
                  })}
                </span>
              )}
              {option.savingPercent !== null && option.savingPercent > 0 && (
                <Badge
                  variant="secondary"
                  className="border-emerald-600/20 bg-emerald-500/15 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  {t("savePercent", { percent: option.savingPercent })}
                </Badge>
              )}
            </div>

            {option.standardPriceEGP !== null && (
              <p className="mt-1 text-sm font-semibold text-primary">
                {t("earlyBirdPrice")}
              </p>
            )}
          </div>
        )}

        {!plan.fitsCurrentCatalogue && (
          <p className="text-sm font-semibold text-destructive">
            {t("tooSmall")}
          </p>
        )}

        {/* Benefits list section */}
        <div className="space-y-3 border-t pt-3">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("includedFeatures")}
          </p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-foreground">
                {plan.productCap === null
                  ? t("unlimitedProducts")
                  : t("upToProducts", {
                      cap: plan.productCap.toLocaleString(),
                    })}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-foreground/90">
                {t("benefits.aiForecasting")}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-foreground/90">
                {t("benefits.surplusOffers")}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span
                className={cn(
                  "text-foreground/90",
                  isScale && "font-semibold text-foreground"
                )}
              >
                {isScale
                  ? t("benefits.advancedInventory")
                  : t("benefits.inventoryRecipes")}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-foreground/90">
                {t("benefits.orderRefunds")}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span
                className={cn(
                  "text-foreground/90",
                  isScale && "font-semibold text-foreground"
                )}
              >
                {t("benefits.analytics")}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-foreground/90">
                {t("benefits.weeklyPayouts")}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-foreground/90">
                {t("benefits.customerGrowth")}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span
                className={cn(
                  "text-foreground/90",
                  isScale && "font-semibold text-primary"
                )}
              >
                {isScale
                  ? t("benefits.prioritySupport")
                  : t("benefits.standardSupport")}
              </span>
            </li>
          </ul>
        </div>

        {/* Why the card is dead, said plainly. The backend supplies the
            sentence, including the date it frees up. */}
        {!notSold && option.blockedReason && (
          <p className="flex items-start gap-1.5 text-sm font-medium text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {option.blockedReason}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
