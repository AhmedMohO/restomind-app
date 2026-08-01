"use client"

import { use } from "react"

import { RecipeEditor } from "@/features/recipes/components/recipe-editor"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function DashboardRecipeEditorPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>
}) {
  const { productId } = use(params)

  return (
    <DashboardAuthGuard roles={["manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <RecipeEditor productId={productId} />
      </main>
    </DashboardAuthGuard>
  )
}
