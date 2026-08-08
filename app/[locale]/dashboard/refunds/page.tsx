"use client"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { RefundsContainer } from "@/features/refunds/components/refunds-container"

export default function RefundsPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <RefundsContainer />
      </main>
    </DashboardAuthGuard>
  )
}
