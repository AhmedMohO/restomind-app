const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "RestoMind",
    alternateName: ["ريستوميند", "RestoMind"],
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.webp`,
    description:
      "AI-powered food waste prediction and surplus rescue platform for bakeries and restaurants.",
    foundingDate: "2026",
    areaServed: {
      "@type": "Country",
      name: "Egypt",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@restomind.app",
      areaServed: "EG",
      availableLanguage: ["en", "ar"],
    },
  }
}

export function websiteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "RestoMind",
    alternateName: ["ريستوميند", "RestoMind"],
    url: BASE_URL,
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/${locale}/offers?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function homepageJsonLd(title: string, description: string, url: string, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}/#webpage`,
    url: `${BASE_URL}${url}`,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
    },
    about: {
      "@id": `${BASE_URL}/#organization`,
    },
    mainEntity: {
      "@id": `${BASE_URL}/#organization`,
    },
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
  }
}

export function webpageJsonLd(name: string, description: string, url: string, locale: string) {
  const absoluteUrl = url.startsWith("http") ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl,
    inLanguage: locale,
    publisher: {
      "@type": "Organization",
      name: "RestoMind",
      url: BASE_URL,
    },
  }
}

interface ProductJsonLdInput {
  id: string
  title: string
  description: string
  price: number
  image?: string
  category: string
  isAvailable: boolean
}

export function productJsonLd(product: ProductJsonLdInput) {
  const availability = product.isAvailable
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock"

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(product.description && { description: product.description }),
    ...(product.image && { image: product.image }),
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EGP",
      availability,
      seller: {
        "@type": "Organization",
        name: "RestoMind",
      },
      url: `${BASE_URL}/en/offers/${product.id}`,
    },
  }
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const absoluteUrl = item.url.startsWith("http")
        ? item.url
        : `${BASE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl,
      }
    }),
  }
}
