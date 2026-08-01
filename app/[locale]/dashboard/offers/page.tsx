"use client"

import { OffersContainer } from "@/features/offers/components/offers-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardOffersPage() {
  return (
    <DashboardAuthGuard roles={["manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <OffersContainer />
      </main>
    </DashboardAuthGuard>
  )
}
