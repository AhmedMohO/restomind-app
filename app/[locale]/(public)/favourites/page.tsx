"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Heart, ShoppingBag, Loader2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useCart } from "@/hooks/use-cart"
import { MOCK_PRODUCTS } from "@/features/products/data"
import ProductCard from "@/features/products/ProductCard"

export default function FavouritesPage() {
  const t = useTranslations("Favourites")
  const { wishlist } = useCart()
  const [mounted, setMounted] = useState(false)

  // Prevent server-side hydration mismatches by rendering empty/skeleton initially
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter products that exist in wishlist
  const favouriteProducts = MOCK_PRODUCTS.filter((product) =>
    wishlist.includes(product.id)
  )

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-[#7C4A27] dark:text-[#C2733C]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 min-h-[60vh]">
      {/* Title Header Section */}
      <div className="bg-white border border-[#ECE6DB] rounded-[24px] p-6 sm:p-8 space-y-2 dark:bg-neutral-900 dark:border-neutral-800 transition-colors shadow-xs">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1B15] dark:text-neutral-100 flex items-center gap-3">
          <Heart className="size-8 text-rose-500 fill-rose-500/10 shrink-0" />
          <span>{t("title")}</span>
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Favourites Grid / Empty State */}
      {favouriteProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favouriteProducts.map((product) => (
            <div 
              key={product.id} 
              className="animate-in fade-in duration-300"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#ECE6DB] rounded-[24px] bg-white dark:bg-neutral-900 dark:border-neutral-800 p-8 space-y-5 animate-in fade-in duration-300">
          <div className="bg-rose-50 dark:bg-rose-950/20 p-5 rounded-full text-rose-500 transition-colors">
            <Heart size={44} className="stroke-[1.5] fill-rose-500/10" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
              {t("empty")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {t("emptyDesc")}
            </p>
          </div>
          <Link
            href="/offers"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432] text-xs font-semibold px-6 transition-all shadow-sm"
          >
            <ShoppingBag className="size-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{t("backToOffers")}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
