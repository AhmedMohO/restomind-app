"use client"

import { use } from "react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
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
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <CategoryDetailsContainer id={id} />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
