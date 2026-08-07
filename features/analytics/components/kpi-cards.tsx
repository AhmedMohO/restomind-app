"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  LineChart,
  Tag,
  Clock,
} from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import type { AdminKpiSummary, ManagerKpiSummary } from "../types"

interface KpiCardsProps {
  summary?: AdminKpiSummary | ManagerKpiSummary
  role: "admin" | "manager"
  isLoading?: boolean
}

export function KpiCards({ summary, role, isLoading = false }: KpiCardsProps) {
  const t = useTranslations("Dashboard.analytics")
  const locale = useLocale()
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US"

  if (isLoading || !summary) {
    return (
      <div className="space-y-4">
        {/* Row 1 Skeletons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs"
            >
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="size-9 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-28 rounded-md" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Row 2 Skeletons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs"
            >
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="size-9 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat(numberLocale).format(val)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(val)
  }

  const formatPercent = (val: number) => {
    return new Intl.NumberFormat(numberLocale, {
      maximumFractionDigits: 1,
    }).format(Math.abs(val))
  }

  const revCurrent = summary.revenue?.current ?? 0
  const ordersCurrent = summary.orders?.current ?? 0
  const isRoleAdmin = role === "admin"

  const avgOrderVal =
    summary.avgOrderValue ??
    (ordersCurrent > 0 ? Math.round(revCurrent / ordersCurrent) : 0)

  const platform = isRoleAdmin
    ? (summary as AdminKpiSummary).platform
    : undefined
  const managerSummary = isRoleAdmin
    ? undefined
    : (summary as ManagerKpiSummary)

  /**
   * The third card is the one that differs by role, and deliberately so.
   *
   * For an admin it is RestoMind's own revenue — commission plus subscriptions.
   * It used to be GMV minus 14% "tax", which measured nothing: GMV is the
   * merchants' money, and the platform never earned or owed a percentage of it.
   *
   * For a manager it is their takings after the commission was deducted, which
   * is the number they actually care about. It is an estimate over the selected
   * window; the payable balance lives on the payouts statement, where refunds,
   * adjustments and the settlement hold are applied.
   */
  const thirdCard = isRoleAdmin
    ? {
        id: "platformRevenue",
        title: t("kpiPlatformRevenue"),
        value: formatCurrency(platform?.totalRevenue ?? 0),
        subtitle: t("kpiPlatformRevenueSub", {
          commission: formatCurrency(platform?.commission.current ?? 0),
          subscriptions: formatCurrency(
            platform?.subscriptionRevenue.current ?? 0
          ),
        }),
        changePercent: platform?.commission.changePercent,
        icon: TrendingUp,
        iconBg:
          "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
      }
    : {
        id: "netAfterCommission",
        title: t("kpiNetAfterCommission"),
        value: formatCurrency(
          managerSummary?.netAfterCommission ?? revCurrent
        ),
        subtitle: t("kpiNetAfterCommissionSub", {
          commission: formatCurrency(managerSummary?.commissionCharged ?? 0),
          rate: formatPercent((managerSummary?.commissionRate ?? 0) * 100),
        }),
        changePercent: summary.revenue?.changePercent,
        icon: TrendingUp,
        iconBg:
          "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
      }

  const primaryCards = [
    {
      id: "orders",
      title: t("kpiOrders"),
      value: formatNumber(ordersCurrent),
      subtitle: t("kpiOrdersSub"),
      changePercent: summary.orders?.changePercent,
      icon: ShoppingBag,
      iconBg: "bg-primary/10 text-primary border-primary/20",
    },
    {
      id: "revenue",
      // An admin's "revenue" is GMV — money that belongs to the merchants.
      // Labelling it as such is the whole point of splitting these apart.
      title: isRoleAdmin ? t("kpiGmv") : t("kpiRevenue"),
      value: formatCurrency(revCurrent),
      subtitle: isRoleAdmin ? t("kpiGmvSub") : t("kpiRevenueSub"),
      changePercent: summary.revenue?.changePercent,
      icon: DollarSign,
      iconBg: "bg-primary/10 text-primary border-primary/20",
    },
    thirdCard,
    {
      id: "avgOrder",
      title: t("kpiAvgOrder"),
      value: formatCurrency(avgOrderVal),
      subtitle: t("kpiAvgOrderSub"),
      changePercent: undefined,
      icon: LineChart,
      iconBg: "bg-primary/10 text-primary border-primary/20",
    },
  ]

  const totalUsersVal = summary.totalUsers ?? 0
  const totalRestaurantsVal =
    summary.totalRestaurants ??
    ("activeRestaurants" in summary
      ? (summary as AdminKpiSummary).activeRestaurants
      : 0) ??
    0

  const secondaryCards = isRoleAdmin
    ? [
        {
          id: "users",
          title: t("kpiUsers"),
          value: formatNumber(totalUsersVal),
          subtitle: t("kpiUsersSub"),
          icon: Users,
          iconBg: "bg-muted text-muted-foreground border-border/60",
        },
        {
          id: "restaurants",
          title: t("kpiRestaurants"),
          value: formatNumber(totalRestaurantsVal),
          // The paying/trialling split is the number that decides whether the
          // restaurant count is revenue or pipeline.
          subtitle: platform
            ? t("kpiRestaurantsSubscribed", {
                paid: formatNumber(platform.paidSubscriptions),
                trial: formatNumber(platform.trialSubscriptions),
              })
            : t("kpiRestaurantsSub"),
          icon: Store,
          iconBg: "bg-muted text-muted-foreground border-border/60",
        },
      ]
    : [
        {
          id: "activeOffers",
          title: t("kpiActiveOffers"),
          value: formatNumber(summary.activeOffers ?? 0),
          subtitle: t("quickAccessOffersSub"),
          icon: Tag,
          iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        },
        {
          id: "pendingOrders",
          title: t("chartOrdersStatusTitle"),
          value: formatNumber(summary.pendingOrders ?? 0),
          subtitle: t("alertStuckPendingManager", {
            count: formatNumber(summary.pendingOrders ?? 0),
          }),
          icon: Clock,
          iconBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        },
      ]

  return (
    <div className="space-y-4">
      {/* Row 1: 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryCards.map((card) => {
          const Icon = card.icon
          const hasChange = card.changePercent !== undefined

          return (
            <Card
              key={card.id}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-md"
            >
              <CardContent className="p-0 space-y-3">
                {/* Header: Title + Change Badge + Icon */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground">
                      {card.title}
                    </span>
                    {hasChange && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors",
                          card.changePercent! > 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : card.changePercent! < 0
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : "bg-muted text-muted-foreground border-border/60"
                        )}
                      >
                        {card.changePercent! > 0 ? (
                          <TrendingUp className="size-3 shrink-0" />
                        ) : card.changePercent! < 0 ? (
                          <TrendingDown className="size-3 shrink-0" />
                        ) : null}
                        {card.changePercent! > 0
                          ? `+${formatPercent(card.changePercent!)}%`
                          : card.changePercent! < 0
                          ? `-${formatPercent(card.changePercent!)}%`
                          : `${formatPercent(card.changePercent!)}%`}
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border p-2 shadow-2xs transition-transform group-hover:scale-105",
                      card.iconBg
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>

                {/* Big Value + Subtitle */}
                <div className="space-y-1">
                  <div className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                    {card.value}
                  </div>
                  <p className="truncate text-[11px] font-medium text-muted-foreground">
                    {card.subtitle}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Row 2: 2 Secondary Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {secondaryCards.map((card) => {
          const Icon = card.icon

          return (
            <Card
              key={card.id}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-md"
            >
              <CardContent className="p-0 space-y-3">
                {/* Header: Title + Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
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

                {/* Value + Subtitle */}
                <div className="space-y-1">
                  <div className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                    {card.value}
                  </div>
                  <p className="truncate text-[11px] font-medium text-muted-foreground">
                    {card.subtitle}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


