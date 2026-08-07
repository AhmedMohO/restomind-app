"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  Banknote,
  CreditCard,
  Percent,
  RotateCcw,
  Wallet,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlatformKpis } from "../types"

/**
 * Admin-only: where RestoMind's money comes from, and what it still owes.
 *
 * The dashboard used to report GMV as "revenue" and GMV × 86% as "net profit",
 * neither of which is the platform's money at all. This card is the correction:
 * commission and subscriptions on one side, refunds and unsettled payouts on
 * the other.
 */
export function PlatformRevenueCard({
  platform,
  isLoading,
}: {
  platform?: PlatformKpis
  isLoading?: boolean
}) {
  const t = useTranslations("Dashboard.analytics")
  const locale = useLocale()
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US"

  const money = (value: number) =>
    new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(value)

  if (isLoading || !platform) {
    return (
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <CardContent className="space-y-4 p-0">
          <Skeleton className="h-5 w-40 rounded-md" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const rows = [
    {
      id: "commission",
      icon: Percent,
      label: t("platformCommission"),
      value: money(platform.commission.current),
      // VAT is collected on RestoMind's behalf and paid onward, so the gross
      // commission figure overstates what the company keeps.
      hint: t("platformCommissionHint", {
        net: money(platform.commissionNet),
        vat: money(platform.commissionVat),
      }),
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "subscriptions",
      icon: CreditCard,
      label: t("platformSubscriptions"),
      value: money(platform.subscriptionRevenue.current),
      hint: t("platformSubscriptionsHint", {
        paid: platform.paidSubscriptions,
        trial: platform.trialSubscriptions,
      }),
      tone: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "payouts",
      icon: Wallet,
      label: t("platformPayoutsPending"),
      value: money(platform.payoutsPending),
      hint: t("platformPayoutsPendingHint", {
        count: platform.payoutsPendingCount,
        completed: money(platform.payoutsCompleted),
      }),
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      id: "refunds",
      icon: RotateCcw,
      label: t("platformRefunded"),
      value: money(platform.refundedAmount),
      hint: t("platformRefundedHint", { count: platform.refundsPending }),
      tone: "text-rose-600 dark:text-rose-400",
    },
  ]

  const maxPlanAmount = Math.max(
    1,
    ...platform.revenueByPlan.map((plan) => plan.amount)
  )

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Banknote className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">
              {t("platformTitle")}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {t("platformSubtitle")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-0">
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => {
            const Icon = row.icon
            return (
              <div
                key={row.id}
                className="rounded-xl border border-border/60 bg-muted/30 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {row.label}
                  </span>
                  <Icon className={`size-3.5 shrink-0 ${row.tone}`} />
                </div>
                <p
                  className={`mt-1 text-xl font-black tracking-tight tabular-nums ${row.tone}`}
                >
                  {row.value}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  {row.hint}
                </p>
              </div>
            )
          })}
        </div>

        {/* Which plan actually pays for the company. */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase">
            {t("platformByPlan")}
          </p>
          {platform.revenueByPlan.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-center text-[11px] text-muted-foreground">
              {t("platformByPlanEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {platform.revenueByPlan.map((plan) => (
                <li key={plan.tier} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium capitalize">
                      {plan.label}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {money(plan.amount)}
                      <span className="ms-1.5 text-[10px] text-muted-foreground">
                        ×{plan.count}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{
                        width: `${(plan.amount / maxPlanAmount) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
