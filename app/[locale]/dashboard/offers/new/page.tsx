import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { OfferFormPage } from "@/features/offers/components/offer-form-page"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Dashboard.offers" })
  return {
    title: t("createOffer"),
    description: t("formPageSubtitleCreate"),
    robots: { index: false, follow: false },
  }
}

export default async function NewOfferPage({
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
        <OfferFormPage />
      </main>
    </AppSidebar>
  )
}
