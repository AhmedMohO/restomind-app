import React from "react"
import { Link } from "@/i18n/routing"
import { notFound } from "next/navigation"
import { MOCK_PRODUCTS } from "@/features/products/data"
import ProductDetails from "@/features/products/ProductDetails"
import { ArrowLeft, Search } from "lucide-react"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = MOCK_PRODUCTS.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
        <div className="dark:bg-neutral-850 rounded-full bg-[#FAF2ED] p-4 text-primary dark:text-[#E68A49]">
          <Search size={48} />
        </div>
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold text-[#2B1B15] dark:text-neutral-100">
            Product Not Found
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            We couldn&apos;t find the bakery item you are looking for. It may
            have been discontinued or renamed.
          </p>
        </div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C4A27] hover:underline dark:text-[#E68A49]"
        >
          <ArrowLeft size={16} />
          <span>Return to shop</span>
        </Link>
      </div>
    )
  }

  return <ProductDetails product={product} />
}

// Generate static params for optimal server rendering
export async function generateStaticParams() {
  return MOCK_PRODUCTS.map((product) => ({
    id: product.id,
  }))
}
