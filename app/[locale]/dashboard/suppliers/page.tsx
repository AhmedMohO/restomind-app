"use client"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { SuppliersContainer } from "@/features/suppliers/components/suppliers-container"

export default function DashboardSuppliersPage() {
  return (
    <DashboardAuthGuard roles={["manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <SuppliersContainer />
      </main>
    </DashboardAuthGuard>
  )
}
