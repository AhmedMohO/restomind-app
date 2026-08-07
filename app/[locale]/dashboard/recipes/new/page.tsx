"use client"

import { AddRecipeContainer } from "@/features/recipes/components/add-recipe-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardAddRecipePage() {
  return (
    <DashboardAuthGuard roles={["manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <AddRecipeContainer />
      </main>
    </DashboardAuthGuard>
  )
}
