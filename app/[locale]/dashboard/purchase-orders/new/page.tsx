"use client"

import { Suspense } from "react"
import { PurchaseOrderFormPage } from "@/features/purchase-orders/components/purchase-order-form-page"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function NewPurchaseOrderPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <Suspense
          fallback={
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading form...
            </div>
          }
        >
          <PurchaseOrderFormPage />
        </Suspense>
      </main>
    </DashboardAuthGuard>
  )
}
