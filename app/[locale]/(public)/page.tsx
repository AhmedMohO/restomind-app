import { Suspense } from "react"
import { setRequestLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import HeroSection from "@/features/landing/components/HeroSection"
import StorySection from "@/features/landing/components/StorySection"
import PartnersSection from "@/features/landing/components/PartnersSection"
import RecommendedSection from "@/features/landing/components/RecommendedSection"
import RecommendedSkeleton from "@/features/landing/components/RecommendedSkeleton"
import { websiteJsonLd, homepageJsonLd } from "@/lib/seo/json-ld"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return {
    title:
      locale === "ar"
        ? "ريستوميند — توقع الهدر، شارك الوفرة"
        : "RestoMind — Predict Waste, Share Abundance",
    alternates: {
      canonical: locale === "en" ? "/" : "/ar",
      languages: {
        en: "/",
        ar: "/ar",
        "x-default": "/",
      },
    },
    openGraph: {
      url: `${baseUrl}/${locale}`,
      locale: locale === "ar" ? "ar_EG" : "en_US",
    },
  }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "metadata" })
  const siteSchema = websiteJsonLd(locale)
  const pageSchema = homepageJsonLd(
    t("title"),
    t("description"),
    `/${locale}`,
    locale
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <HeroSection />
      <PartnersSection />
      <Suspense fallback={<RecommendedSkeleton />}>
        <RecommendedSection />
      </Suspense>
      <StorySection />
    </>
  )
}
