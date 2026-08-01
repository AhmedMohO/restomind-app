import { setRequestLocale } from "next-intl/server"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { WasteSummaryCards } from "@/features/waste/components/waste-summary-cards"
import { RiskBreakdownChart } from "@/features/waste/components/risk-breakdown-chart"
import { WasteTable } from "@/features/waste/components/waste-table"

/**
 * Waste & surplus — ingredient-level surplus risk from the last scan, and
 * the forecast behind each report. A thin server shell: the scan action,
 * the stat tiles, the risk chart, and the audit-trail table are all client
 * components composed in below it (mirrors the recommendations/predictions
 * screens' server-shell + client-sections split).
 */
export default async function DashboardWastePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <DashboardAuthGuard roles={["manager"]}>
      <main className="w-full min-w-0 flex-1 space-y-6 p-4 sm:p-6">
        <WasteSummaryCards />
        <RiskBreakdownChart />
        <WasteTable />
      </main>
    </DashboardAuthGuard>
  )
}
