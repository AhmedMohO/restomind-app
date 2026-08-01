"use client"

import { RecipesContainer } from "@/features/recipes/components/recipes-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardRecipesPage() {
  return (
    <DashboardAuthGuard roles={["manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <RecipesContainer />
      </main>
    </DashboardAuthGuard>
  )
}
