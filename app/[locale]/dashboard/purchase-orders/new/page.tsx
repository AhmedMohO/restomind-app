"use client"

import { Suspense } from "react"
import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { PurchaseOrderFormPage } from "@/features/purchase-orders/components/purchase-order-form-page"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function NewPurchaseOrderPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading form...</div>}>
            <PurchaseOrderFormPage />
          </Suspense>
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
