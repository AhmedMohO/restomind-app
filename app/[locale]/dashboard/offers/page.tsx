import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { OffersContainer } from "@/features/offers/components/offers-container"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Dashboard.offers" })
  return {
    title: t("title"),
    description: t("subtitle"),
    robots: { index: false, follow: false },
  }
}

export default async function DashboardOffersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["manager"], locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <OffersContainer />
      </main>
    </AppSidebar>
  )
}
