import type { MetadataRoute } from "next"
import { getProducts } from "@/features/products/api"
import { routing } from "@/i18n/routing"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const staticPaths = ["", "/offers", "/login", "/register", "/forgot-password"]

function getAlternates(path: string) {
  return {
    languages: {
      en: `${BASE_URL}/en${path}`,
      ar: `${BASE_URL}/ar${path}`,
      "x-default": `${BASE_URL}/en${path}`,
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productSlugs: string[] = []
  try {
    const res = await getProducts({ limit: 200 })
    if (res?.items) {
      productSlugs = res.items.map((p) => p._id)
    }
  } catch {
    productSlugs = []
  }

  const allPaths = [
    ...staticPaths.map((path) => ({
      path,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1.0 : 0.8,
    })),
    ...productSlugs.map((slug) => ({
      path: `/offers/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]

  const entries: MetadataRoute.Sitemap = []

  for (const item of allPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${item.path}`,
        lastModified: item.lastModified,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: getAlternates(item.path),
      })
    }
  }

  return entries
}
