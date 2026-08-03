import { setRequestLocale } from "next-intl/server"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { PlanTable } from "@/features/production-plan/components/plan-table"

/**
 * Daily production plan — a kitchen data-entry screen, not a report. A thin
 * server shell: the date filter and the debounced/batched actuals-entry
 * state all live in the client `PlanTable`.
 */
export default async function DashboardProductionPlanPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <DashboardAuthGuard roles={["manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <PlanTable />
      </main>
    </DashboardAuthGuard>
  )
}
