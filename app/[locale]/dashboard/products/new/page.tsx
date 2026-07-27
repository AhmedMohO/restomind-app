"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { ProductFormPage } from "@/features/products/components/product-form-page"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function NewProductPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
          <ProductFormPage mode="create" />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
