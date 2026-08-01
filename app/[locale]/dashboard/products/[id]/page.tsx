"use client"

import { use } from "react"

import { ProductDetailsContainer } from "@/features/products/components/product-details-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <ProductDetailsContainer id={id} />
      </main>
    </DashboardAuthGuard>
  )
}
