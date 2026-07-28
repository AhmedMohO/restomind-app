"use client"

import { use } from "react"
import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { PurchaseOrderDetailsContainer } from "@/features/purchase-orders/components/purchase-order-details-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function PurchaseOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <PurchaseOrderDetailsContainer id={id} />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
