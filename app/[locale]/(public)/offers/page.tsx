import { Suspense } from "react"
import { setRequestLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { getAlternates } from "@/lib/seo/metadata"
import { webpageJsonLd } from "@/lib/seo/json-ld"
import OffersContentClient from "./offers-content-client"
import { getProducts } from "@/features/products/api"

type Props = {
  params: Promise<{ locale: string }>
}

function OffersLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
    </div>
  )
}

async function OffersListFetcher() {
  const initialPage = await getProducts({ page: 1, limit: 12 })

  return <OffersContentClient initialPage={initialPage} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Offers" })

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: getAlternates(locale, "/offers"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/offers`,
    },
  }
}

export default async function OffersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "Offers" })

  const schema = webpageJsonLd(
    t("title"),
    t("subtitle"),
    `/${locale}/offers`,
    locale
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense fallback={<OffersLoading />}>
        <OffersListFetcher />
      </Suspense>
    </>
  )
}
