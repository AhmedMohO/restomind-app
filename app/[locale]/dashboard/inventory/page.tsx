"use client"

import { InventoryContainer } from "@/features/inventory/components/inventory-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardInventoryPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <InventoryContainer />
      </main>
    </DashboardAuthGuard>
  )
}
