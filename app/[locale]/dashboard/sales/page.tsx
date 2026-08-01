"use client"

import { SalesContainer } from "@/features/sales/components/sales-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

/**
 * Sales ledger — admins see every restaurant, managers are scoped upstream to
 * their own.
 */
export default function DashboardSalesPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <SalesContainer />
      </main>
    </DashboardAuthGuard>
  )
}
