import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { ProductsContainer } from "@/features/products/components/products-container"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Dashboard.products" })
  return {
    title: t("adminTitle"),
    description: t("adminSubtitle"),
    robots: { index: false, follow: false },
  }
}

export default async function DashboardProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["admin", "manager"], locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <ProductsContainer />
      </main>
    </AppSidebar>
  )
}

