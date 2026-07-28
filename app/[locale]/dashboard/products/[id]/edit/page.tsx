"use client"

import { use } from "react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { ProductFormPage } from "@/features/products/components/product-form-page"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
          <ProductFormPage mode="edit" id={id} />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
