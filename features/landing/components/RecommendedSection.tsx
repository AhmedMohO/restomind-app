import { getTranslations } from "next-intl/server"
import { MOCK_PRODUCTS } from "@/features/products/data"
import ProductCarousel from "@/components/common/ProductCarousel"

export default async function RecommendedSection() {
  const t = await getTranslations("Recommended")
  
  // Filter for available products
  const recommendedProducts = MOCK_PRODUCTS.filter((p) => p.isAvailable)

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-neutral-900/40 py-16 border-b border-border/40 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <ProductCarousel
          products={recommendedProducts}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      </div>
    </section>
  )
}
