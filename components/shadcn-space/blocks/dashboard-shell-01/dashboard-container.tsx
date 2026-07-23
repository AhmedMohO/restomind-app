"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { KpiCards } from "@/features/analytics/components/kpi-cards"
import { AlertsPanel } from "@/features/analytics/components/alerts-panel"
import { RevenueChart } from "@/features/analytics/components/revenue-chart"
import { OrdersStatusChart } from "@/features/analytics/components/orders-status-chart"
import { RecentOrdersTable } from "@/features/analytics/components/recent-orders-table"
import { getAdminDashboardStats, getManagerDashboardStats } from "@/features/analytics/api"
import type { AnalyticsPeriod, DashboardStatsResponse, ManagerDashboardStatsResponse } from "@/features/analytics/types"

export function DashboardContainer() {
  const { role, isLoading, user } = useAuth()
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d")
  const [adminStats, setAdminStats] = useState<DashboardStatsResponse | null>(null)
  const [managerStats, setManagerStats] = useState<ManagerDashboardStatsResponse | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  const t = useTranslations("Dashboard.analytics")

  useEffect(() => {
    if (isLoading) return

    let isMounted = true
    setIsFetching(true)

    async function loadData() {
      try {
        if (role === "admin") {
          const data = await getAdminDashboardStats(period)
          if (isMounted) setAdminStats(data)
        } else if (role === "manager") {
          const data = await getManagerDashboardStats(period, user?.firstName ? `${user.firstName}'s Restaurant` : undefined)
          if (isMounted) setManagerStats(data)
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err)
      } finally {
        if (isMounted) setIsFetching(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [role, period, isLoading, user])

  if (isLoading || (isFetching && !adminStats && !managerStats)) {
    return (
      <div className="flex min-h-[500px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">Loading dashboard overview…</p>
        </div>
      </div>
    )
  }

  const isRoleAdmin = role === "admin"
  const currentSummary = isRoleAdmin ? adminStats?.kpis : managerStats?.kpis
  const currentTrend = isRoleAdmin ? adminStats?.revenueTrend : managerStats?.revenueTrend
  const currentOrdersByStatus = isRoleAdmin ? adminStats?.ordersByStatus : managerStats?.ordersByStatus
  const currentRecentOrders = isRoleAdmin ? adminStats?.recentOrders : managerStats?.recentOrders
  const currentAlerts = isRoleAdmin ? adminStats?.alerts : managerStats?.alerts

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("overviewTitle")}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isRoleAdmin
              ? t("overviewSubtitleAdmin")
              : t("overviewSubtitleManager", { restaurant: managerStats?.restaurantName || "" })}
          </p>
        </div>

        {/* Period Selector Toggle */}
        <div className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/50 p-1 w-fit">
          <Button
            variant={period === "7d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("7d")}
            className="h-7 rounded-full px-3.5 text-xs font-semibold"
          >
            {t("period7Days")}
          </Button>
          <Button
            variant={period === "30d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("30d")}
            className="h-7 rounded-full px-3.5 text-xs font-semibold"
          >
            {t("period30Days")}
          </Button>
        </div>
      </div>

      {/* KPI Cards Block */}
      {currentSummary && <KpiCards summary={currentSummary} role={isRoleAdmin ? "admin" : "manager"} />}

      {/* Actionable Alerts Panel */}
      {currentAlerts && <AlertsPanel alerts={currentAlerts} />}

      {/* 2-Column Section: Revenue Trend & Orders by Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          {currentTrend && <RevenueChart data={currentTrend} period={period} />}
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          {currentOrdersByStatus && <OrdersStatusChart ordersByStatus={currentOrdersByStatus} />}
        </div>
      </div>

      {/* Recent Orders Section */}
      {currentRecentOrders && <RecentOrdersTable orders={currentRecentOrders} />}
    </div>
  )
}
