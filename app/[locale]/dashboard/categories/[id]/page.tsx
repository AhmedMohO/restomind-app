"use client"

import { use } from "react"

import { CategoryDetailsContainer } from "@/features/categories/components/category-details-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function CategoryDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["admin"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <CategoryDetailsContainer id={id} />
      </main>
    </DashboardAuthGuard>
  )
}
