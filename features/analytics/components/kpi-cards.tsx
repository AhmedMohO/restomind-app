"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  ShoppingBag,
  Tag,
  Store,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { AdminKpiSummary, ManagerKpiSummary, KpiMetric } from "../types"

interface KpiCardsProps {
  summary: AdminKpiSummary | ManagerKpiSummary
  role: "admin" | "manager"
}

export function KpiCards({ summary, role }: KpiCardsProps) {
  const t = useTranslations("Dashboard.analytics")

  const isMetricPositive = (metric?: KpiMetric) =>
    metric ? metric.changePercent >= 0 : true

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(val)
  }

  const cards = [
    {
      id: "revenue",
      title: t("kpiRevenue"),
      value: formatCurrency(summary.revenue.current),
      metric: summary.revenue,
      icon: DollarSign,
      iconBg:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      accentBorder: "hover:border-emerald-500/40",
    },
    {
      id: "orders",
      title: t("kpiOrders"),
      value: summary.orders.current.toLocaleString(),
      metric: summary.orders,
      icon: ShoppingBag,
      iconBg:
        "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      accentBorder: "hover:border-blue-500/40",
    },
    {
      id: "activeOffers",
      title: t("kpiActiveOffers"),
      value: summary.activeOffers.toLocaleString(),
      icon: Tag,
      iconBg:
        "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
      accentBorder: "hover:border-violet-500/40",
    },
    ...(role === "admin" && "activeRestaurants" in summary
      ? [
          {
            id: "activeRestaurants",
            title: t("kpiActiveRestaurants"),
            value: (
              summary as AdminKpiSummary
            ).activeRestaurants.toLocaleString(),
            icon: Store,
            iconBg:
              "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
            accentBorder: "hover:border-sky-500/40",
          },
        ]
      : []),
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const positive = card.metric ? isMetricPositive(card.metric) : undefined

        return (
          <Card
            key={card.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-0 transition-all duration-300",
              card.accentBorder
            )}
          >
            {/* Soft Ambient Background Gradient Glow */}
            <div
              className={cn(
                "pointer-events-none absolute -top-8 -right-8 size-28 rounded-full opacity-60 blur-xl transition-opacity group-hover:opacity-100"
              )}
            />

            <CardContent className="relative z-10 flex h-full flex-col space-y-4 p-5">
              {/* Header: Title + Icon */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {card.title}
                </span>
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border p-2 shadow-2xs transition-transform group-hover:scale-105",
                    card.iconBg
                  )}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              {/* Value + Delta / Action Badge */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                    {card.value}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {card.metric && (
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "flex items-center gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-bold shadow-2xs",
                          positive
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        )}
                      >
                        {positive ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <TrendingDown className="size-3" />
                        )}
                        <span>
                          {positive
                            ? `+${card.metric.changePercent.toFixed(1)}%`
                            : `${card.metric.changePercent.toFixed(1)}%`}
                        </span>
                      </Badge>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        vs prev period
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
