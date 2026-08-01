"use client"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { AdminPartnershipTable } from "@/features/partner/components/admin-partnership-table"

export default function PartnershipApplicationsPage() {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <AdminPartnershipTable />
      </main>
    </DashboardAuthGuard>
  )
}
