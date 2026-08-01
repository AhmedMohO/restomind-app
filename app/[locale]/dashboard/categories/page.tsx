"use client"

import { CategoryContainer } from "@/features/categories/components/category-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function CategoriesPage() {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <CategoryContainer />
      </main>
    </DashboardAuthGuard>
  )
}
