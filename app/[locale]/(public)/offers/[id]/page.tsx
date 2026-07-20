import React, { Suspense } from "react"
import { Link, routing } from "@/i18n/routing"
import { setRequestLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import ProductDetails from "@/features/products/components/ProductDetails"
import { productMetadata } from "@/lib/seo/metadata"
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld"
import { ArrowLeft, Search } from "lucide-react"
import { getActiveOffers } from "@/features/offers/api"
import { getCachedOffer } from "./product-cache"

interface ProductPageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateStaticParams() {
  try {
    const res = await getActiveOffers({ limit: 5 })
    return routing.locales.flatMap((locale) =>
      (res?.items || []).map((offer) => ({
        locale,
        id: offer.productId.slug || offer._id,
      }))
    )
  } catch (error) {
    console.error(
      "[generateStaticParams] Failed to fetch active offers for static params:",
      error
    )
    return []
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, id } = await params
  const offer = await getCachedOffer(id)
  if (!offer || !offer.productId) return { title: "Offer" }

  const product = offer.productId

  return productMetadata(
    {
      id: product._id,
      title: product.title,
      description: product.description,
      price: product.price,
      image: product.image?.secure_url || "",
      category: product.category?.name || "",
    },
    locale
  )
}

function ProductDetailLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
    </div>
  )
}

async function ProductDetailsFetcher({ params }: ProductPageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "Offers" })

  let offer = null
  try {
    offer = await getCachedOffer(id)
  } catch (error) {
    console.error(`[ProductDetailsFetcher] Error loading offer ${id}:`, error)
  }

  if (!offer || !offer.productId) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
        <div className="dark:bg-neutral-850 rounded-full bg-[#FAF2ED] p-4 text-primary dark:text-[#E68A49]">
          <Search size={48} />
        </div>
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold text-[#2B1B15] dark:text-neutral-100">
            {t("productNotFound")}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("productNotFoundDesc")}
          </p>
        </div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C4A27] hover:underline dark:text-[#E68A49]"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          <span>{t("backToOffers")}</span>
        </Link>
      </div>
    )
  }

  const product = offer.productId

  const jsonLd = productJsonLd({
    id: product._id,
    title: product.title,
    description: product.description,
    price: product.price,
    image: product.image?.secure_url || "",
    category: product.category?.name || "",
    isAvailable: product.isAvailable,
  })

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Offers", url: "/offers" },
    { name: product.title, url: `/offers/${product.slug || offer._id}` },
  ]
  const breadcrumbLd = breadcrumbJsonLd(breadcrumbItems)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProductDetails product={offer} />
    </>
  )
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductDetailLoading />}>
      <ProductDetailsFetcher params={params} />
    </Suspense>
  )
}

