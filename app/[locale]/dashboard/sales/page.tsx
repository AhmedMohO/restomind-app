import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { SalesContainer } from "@/features/sales/components/sales-container"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Dashboard.sales" })
  return {
    title: t("title"),
    description: t("subtitleAdmin"),
    robots: { index: false, follow: false },
  }
}

/**
 * Sales ledger — admins see every restaurant, managers are scoped upstream to
 * their own.
 */
export default async function DashboardSalesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["admin", "manager"], locale)

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <SalesContainer />
      </main>
    </AppSidebar>
  )
}
