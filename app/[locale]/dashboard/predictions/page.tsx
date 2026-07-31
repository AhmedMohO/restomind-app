import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { PredictionsDashboard } from "@/features/predictions/components/predictions-dashboard"

/**
 * Demand forecast — weekly unit predictions per product, with the daily
 * curve (the hero) and the model's explainability factors behind each
 * number. A thin server shell: all interactive state (the target-week
 * filter, the batch-recalculate mutation and its polling) lives in the
 * client `PredictionsDashboard`.
 */
export default async function DashboardPredictionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <DashboardAuthGuard roles={["manager"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
          <PredictionsDashboard />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
