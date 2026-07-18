import { Suspense } from "react"
import { setRequestLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { getAlternates } from "@/lib/seo/metadata"
import { webpageJsonLd } from "@/lib/seo/json-ld"
import OffersContentClient from "./offers-content-client"
import { getProducts, type ApiProduct } from "@/features/products/api"
import type { Product } from "@/features/products/types"

type Props = {
  params: Promise<{ locale: string }>
}

function mapApiProductToProduct(apiProd: ApiProduct): Product {
  const categoryName =
    typeof apiProd.category === "object" && apiProd.category !== null
      ? (apiProd.category as { name: string }).name
      : String(apiProd.category || "General")

  return {
    id: apiProd._id,
    title: apiProd.title,
    description: apiProd.description,
    longDescription: apiProd.longDescription,
    price: apiProd.discountedPrice ?? apiProd.price,
    rating: apiProd.rating ?? 0,
    reviewsCount: apiProd.reviewsCount ?? 0,
    isBestseller: apiProd.isBestseller ?? false,
    isAvailable: apiProd.isAvailable ?? true,
    image:
      apiProd.image?.secure_url ||
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80",
    category: categoryName,
    prepTime: "15 min",
    calories: 250,
    freshnessWindow: apiProd.freshnessWindow || 24,
    tags: apiProd.tags || [],
  }
}

async function OffersListFetcher() {
  let initialProducts: Product[] = []
  try {
    const productsRes = await getProducts({ limit: 100 })
    if (productsRes && Array.isArray(productsRes.items)) {
      initialProducts = productsRes.items.map(mapApiProductToProduct)
    }
  } catch (error) {
    console.error("Failed to fetch products for OffersPage:", error)
  }

  return <OffersContentClient initialProducts={initialProducts} />
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

  const schema = webpageJsonLd(t("title"), t("subtitle"), `/${locale}/offers`, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense fallback={null}>
        <OffersListFetcher />
      </Suspense>
    </>
  )
}
