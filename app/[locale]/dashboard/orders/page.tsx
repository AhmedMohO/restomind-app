"use client"

import { DashboardOrdersTable } from "@/features/orders/components/dashboard-orders-table"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { useAuth } from "@/features/auth/hooks/useAuth"
import type { UserRole } from "@/features/auth/auth"

function OrdersPageContent() {
  // role is guaranteed non-null here since DashboardAuthGuard already verified
  // the user is authenticated with one of the allowed roles
  const { role } = useAuth()

  return (
    <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
      <DashboardOrdersTable role={role as UserRole} />
    </main>
  )
}

export default function DashboardOrdersPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <OrdersPageContent />
    </DashboardAuthGuard>
  )
}
