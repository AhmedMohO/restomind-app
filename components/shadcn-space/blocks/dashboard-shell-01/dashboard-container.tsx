"use client"

import { useAuth } from "@/features/auth/hooks/useAuth"
import StatisticsBlock from "@/components/shadcn-space/blocks/dashboard-shell-01/statistics"
import SalesOverviewChart from "@/components/shadcn-space/blocks/dashboard-shell-01/sales-overview-chart"
import EarningReportChart from "@/components/shadcn-space/blocks/dashboard-shell-01/earning-report-chart"
import TopProductTable from "@/components/shadcn-space/blocks/dashboard-shell-01/top-product-table"
import SalesByCountryWidget from "@/components/shadcn-space/blocks/dashboard-shell-01/salesbycountrywidget"

export function DashboardContainer() {
  const { role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (role === "admin") {
    return <AdminDashboardOverview />
  }

  return <ManagerDashboardOverview />
}

function AdminDashboardOverview() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
      <div className="col-span-12">
        <StatisticsBlock />
      </div>
      <div className="xl:col-span-8 col-span-12">
        <SalesOverviewChart />
      </div>
      <div className="xl:col-span-4 col-span-12">
        <EarningReportChart />
      </div>
      <div className="xl:col-span-8 col-span-12">
        <TopProductTable />
      </div>
      <div className="xl:col-span-4 col-span-12">
        <SalesByCountryWidget />
      </div>
    </div>
  )
}

function ManagerDashboardOverview() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
      <div className="col-span-12">
        <StatisticsBlock />
      </div>
      <div className="xl:col-span-8 col-span-12">
        <SalesOverviewChart />
      </div>
      <div className="xl:col-span-4 col-span-12">
        <EarningReportChart />
      </div>
      <div className="col-span-12">
        <TopProductTable />
      </div>
    </div>
  )
}
