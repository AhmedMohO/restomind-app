import { Suspense } from "react"
import { setRequestLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { getAlternates } from "@/lib/seo/metadata"
import { webpageJsonLd } from "@/lib/seo/json-ld"
import { OffersContentClient } from "./offers-content-client"
import { getActiveOffers } from "@/features/offers/api"
import { getCategories } from "@/features/categories/api"
import { getRestaurants } from "@/features/restaurant/api"

type Props = {
  params: Promise<{ locale: string }>
}

function OffersLoadingSkeleton() {
  return (
    <div className="container mx-auto animate-pulse space-y-6 pt-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted/30" />
        <div className="h-4 w-64 rounded bg-muted/20" />
      </div>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        <div className="hidden h-96 rounded-2xl bg-muted/20 lg:block" />
        <div className="space-y-4 lg:col-span-3">
          <div className="h-10 w-full rounded-xl bg-muted/20" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-[24px] bg-muted/20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function OffersListFetcher() {
  const [offersRes, categoriesRes, restaurantsRes] = await Promise.all([
    getActiveOffers({ page: 1, limit: 100 }).catch(() => undefined),
    getCategories().catch(() => undefined),
    getRestaurants({ page: 1, limit: 100 }).catch(() => undefined),
  ])

  const initialOffers = offersRes?.items ?? []
  const allCategories = categoriesRes?.data ?? []
  const allRestaurants = restaurantsRes?.items ?? []

  return (
    <OffersContentClient
      initialOffers={initialOffers}
      allCategories={allCategories}
      allRestaurants={allRestaurants}
    />
  )
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
      <Suspense fallback={<OffersLoadingSkeleton />}>
        <OffersListFetcher />
      </Suspense>
    </>
  )
}
