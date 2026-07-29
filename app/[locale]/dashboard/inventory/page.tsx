"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { InventoryContainer } from "@/features/inventory/components/inventory-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardInventoryPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
          <InventoryContainer />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
