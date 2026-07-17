import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/*/dashboard", "/*/orders", "/*/checkout", "/*/favourites"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
