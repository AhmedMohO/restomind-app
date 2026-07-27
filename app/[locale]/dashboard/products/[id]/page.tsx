"use client"

import { use } from "react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { ProductDetailsContainer } from "@/features/products/components/product-details-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
          <ProductDetailsContainer id={id} />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
