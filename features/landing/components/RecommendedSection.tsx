"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { fetchRecommendedProductsAction } from "@/features/products/actions"
import type { ApiProduct } from "@/features/products/api/type"
import ProductCarousel from "@/components/common/ProductCarousel"

export default function RecommendedSection() {
  const t = useTranslations("Recommended")
  const [products, setProducts] = useState<ApiProduct[]>([])

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const res = await fetchRecommendedProductsAction({ limit: 20 })
        if (isMounted && res?.items) {
          setProducts(res.items.filter((p) => p.isAvailable))
        }
      } catch {
        // silently fail
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  if (products.length === 0) return null

  return (
    <section className="w-full border-b border-border/40 bg-[#FAF7F2] py-16 transition-colors dark:bg-neutral-900/40">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <ProductCarousel
          products={products}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      </div>
    </section>
  )
}
