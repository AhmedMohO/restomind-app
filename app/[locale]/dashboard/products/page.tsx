"use client"

import { ProductsContainer } from "@/features/products/components/products-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardProductsPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <ProductsContainer />
      </main>
    </DashboardAuthGuard>
  )
}
