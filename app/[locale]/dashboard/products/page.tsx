"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { ProductsContainer } from "@/features/products/components/products-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardProductsPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <ProductsContainer />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
