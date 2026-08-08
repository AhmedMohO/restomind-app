"use client"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { PayoutsContainer } from "@/features/payouts/components/payouts-container"

export default function PayoutsPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <PayoutsContainer />
      </main>
    </DashboardAuthGuard>
  )
}
