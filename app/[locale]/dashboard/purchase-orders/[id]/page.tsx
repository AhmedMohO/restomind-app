"use client"

import { use } from "react"
import { PurchaseOrderDetailsContainer } from "@/features/purchase-orders/components/purchase-order-details-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function PurchaseOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <PurchaseOrderDetailsContainer id={id} />
      </main>
    </DashboardAuthGuard>
  )
}
