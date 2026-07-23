import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { CategoryContainer } from "@/features/categories/components/category-container"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export const metadata: Metadata = {
  title: "Categories Management",
  description: "Create, search, edit, and manage food categories",
  robots: { index: false, follow: false },
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["admin"], locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <CategoryContainer />
      </main>
    </AppSidebar>
  )
}
