import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { CategoryDetailsContainer } from "@/features/categories/components/category-details-container"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export const metadata: Metadata = {
  title: "Category Details",
  description: "View category information and description",
  robots: { index: false, follow: false },
}

export default async function CategoryDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["admin"], locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <CategoryDetailsContainer id={id} />
      </main>
    </AppSidebar>
  )
}
