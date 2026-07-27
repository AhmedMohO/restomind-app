"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { IngredientsContainer } from "@/features/ingredients/components/ingredients-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardIngredientsPage() {
  return (
    <DashboardAuthGuard roles={["manager"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
          <IngredientsContainer />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
