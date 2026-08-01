"use client"

import { use } from "react"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { AdminPartnershipDetail } from "@/features/partner/components/admin-partnership-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default function PartnershipApplicationDetailPage({ params }: Props) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["admin"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <AdminPartnershipDetail id={id} />
      </main>
    </DashboardAuthGuard>
  )
}
