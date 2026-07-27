"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardOrdersTable } from "@/features/orders/components/dashboard-orders-table"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { useAuth } from "@/features/auth/hooks/useAuth"
import type { UserRole } from "@/features/auth/auth"

function OrdersPageContent() {
  // role is guaranteed non-null here since DashboardAuthGuard already verified
  // the user is authenticated with one of the allowed roles
  const { role } = useAuth()

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <DashboardOrdersTable role={role as UserRole} />
      </main>
    </AppSidebar>
  )
}

export default function DashboardOrdersPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <OrdersPageContent />
    </DashboardAuthGuard>
  )
}
