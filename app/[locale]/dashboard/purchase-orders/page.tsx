"use client"

import { PurchaseOrdersContainer } from "@/features/purchase-orders/components/purchase-orders-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardPurchaseOrdersPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <PurchaseOrdersContainer />
      </main>
    </DashboardAuthGuard>
  )
}
