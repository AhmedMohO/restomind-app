import type { Metadata } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export function getAlternates(locale: string, path: string = ""): Metadata["alternates"] {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const pathSuffix = cleanPath === "/" ? "" : cleanPath
  const enUrl = `/en${pathSuffix}` || "/"
  const arUrl = `/ar${pathSuffix}`
  const canonical = locale === "en" ? enUrl : arUrl

  return {
    canonical,
    languages: {
      en: enUrl,
      ar: arUrl,
      "x-default": enUrl,
    },
  }
}

interface ProductMetadataInput {
  id: string
  title: string
  description: string
  price: number
  image?: string
  category: string
}

export function productMetadata(
  product: ProductMetadataInput,
  locale: string
): Metadata {
  const title =
    locale === "ar"
      ? `${product.title} — سعر وطلب | RestoMind`
      : `${product.title} — Order & Save | RestoMind`

  const description =
    locale === "ar"
      ? `اطلب ${product.title} من RestoMind. ${product.description} — سعر ${product.price} جنيه.`
      : `Order ${product.title} on RestoMind. ${product.description} — ${product.price} EGP.`

  const keywords =
    locale === "ar"
      ? [product.title, `${product.title} أونلاين`, "مخبوزات مصر", "طلب أكل", product.category]
      : [product.title, `${product.title} order`, "bakery Egypt", "food rescue", product.category]

  return {
    title,
    description,
    keywords,
    alternates: getAlternates(locale, `/offers/${product.id}`),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE_URL}/${locale}/offers/${product.id}`,
      ...(product.image && {
        images: [{ url: product.image, alt: product.title }],
      }),
    },
  }
}
