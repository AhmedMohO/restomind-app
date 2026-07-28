"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { OffersContainer } from "@/features/offers/components/offers-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardOffersPage() {
  return (
    <DashboardAuthGuard roles={["manager", "staff"]}>
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <OffersContainer />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
