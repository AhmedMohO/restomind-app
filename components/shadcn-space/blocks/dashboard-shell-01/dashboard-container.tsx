"use client"

import { useState } from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { KpiCards } from "@/features/analytics/components/kpi-cards"
import { TopProductsCard } from "@/features/analytics/components/top-products-card"
import { TopCategoriesCard } from "@/features/analytics/components/top-categories-card"
import { TopBranchesCard } from "@/features/analytics/components/top-branches-card"
import { FulfillmentMethodCard } from "@/features/analytics/components/fulfillment-method-card"
import { QuickAccessGrid } from "@/features/analytics/components/quick-access-grid"
import {
  useAdminAnalytics,
  useManagerAnalytics,
} from "@/features/analytics/hooks/use-analytics"
import type { AnalyticsPeriod } from "@/features/analytics/types"

export function DashboardContainer() {
  const { role, isLoading: isAuthLoading } = useAuth()
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d")

  const isRoleAdmin = role === "admin"
  const isRoleManager = role === "manager"

  // Fetch dashboard stats using TanStack Query
  const adminQuery = useAdminAnalytics(period, !isAuthLoading && isRoleAdmin)
  const managerQuery = useManagerAnalytics(
    period,
    !isAuthLoading && isRoleManager
  )

  const t = useTranslations("Dashboard.analytics")

  const activeQuery = isRoleAdmin ? adminQuery : managerQuery
  const isQueryLoading = isAuthLoading || activeQuery.isLoading

  const currentSummary = activeQuery.data?.kpis
  const currentTopProducts = activeQuery.data?.topProducts ?? []
  const currentTopCategories = activeQuery.data?.topCategories ?? []
  const currentTopRestaurants = isRoleAdmin
    ? (adminQuery.data?.topRestaurants ?? [])
    : []
  const currentFulfillmentMethods = activeQuery.data?.fulfillmentMethods ?? []
  const restaurantName = isRoleManager
    ? managerQuery.data?.restaurantName
    : undefined

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
              : t("overviewSubtitleManager", {
                  restaurant: restaurantName || "",
                })}
          </p>
        </div>

        {/* Period Selector Toggle */}
        <div className="flex w-fit items-center gap-1 rounded-full border border-border/80 bg-muted/50 p-1">
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

      {/* Row 1 & 2: Primary and Secondary KPI Metric Cards */}
      <KpiCards
        summary={currentSummary}
        role={isRoleAdmin ? "admin" : "manager"}
        isLoading={isQueryLoading}
      />

      {/* Row 3: 2 Analytics List Cards (Top Products, Top Categories) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsCard
          items={currentTopProducts}
          isLoading={isQueryLoading}
        />
        <TopCategoriesCard
          items={currentTopCategories}
          isLoading={isQueryLoading}
        />
      </div>

      {/* Row 4: Status Cards (Top Restaurants for Admin, Fulfillment Breakdown) */}
      {isRoleAdmin ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopBranchesCard
            branches={currentTopRestaurants}
            isLoading={isQueryLoading}
          />
          <FulfillmentMethodCard
            methods={currentFulfillmentMethods}
            isLoading={isQueryLoading}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <FulfillmentMethodCard
            methods={currentFulfillmentMethods}
            isLoading={isQueryLoading}
          />
        </div>
      )}

      {/* Row 5: Quick Access Shortcuts Grid */}
      <QuickAccessGrid />
    </div>
  )
}
