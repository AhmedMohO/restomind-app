"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { CategoryContainer } from "@/features/categories/components/category-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function CategoriesPage() {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <CategoryContainer />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
