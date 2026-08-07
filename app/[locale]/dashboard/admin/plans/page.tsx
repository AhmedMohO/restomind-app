"use client"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { PlansPanel } from "@/features/plans/components/plans-panel"

export default function AdminPlansPage() {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <PlansPanel />
      </main>
    </DashboardAuthGuard>
  )
}
