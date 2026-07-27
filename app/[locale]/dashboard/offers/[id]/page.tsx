import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { OfferDetailsContainer } from "@/features/offers/components/offer-details-container"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Dashboard.offers" })
  return {
    title: t("offerDetails"),
    description: t("detailsPageSubtitle"),
    robots: { index: false, follow: false },
  }
}

export default async function OfferDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["manager"], locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <OfferDetailsContainer offerId={id} />
      </main>
    </AppSidebar>
  )
}
