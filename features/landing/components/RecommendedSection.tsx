import { getTranslations } from "next-intl/server"
import { fetchRecommendedProductsAction } from "@/features/products/actions"
import ProductCarousel from "@/components/common/ProductCarousel"

export default async function RecommendedSection() {
  const t = await getTranslations("Recommended")
  const res = await fetchRecommendedProductsAction({ limit: 20 })
  const products = res?.items

  return (
    <section className="w-full border-b border-border/40 bg-[#FAF7F2] py-16 transition-colors dark:bg-neutral-900/40">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        {/* <ProductCarousel
          products={products}
          title={t("title")}
          subtitle={t("subtitle")}
        /> */}
      </div>
    </section>
  )
}
