"use client"

import { useCart } from "@/hooks/use-cart"
import ProductCard from "@/features/products/components/ProductCard"
import { useTranslations } from "next-intl"
import { Heart, ShoppingBag } from "lucide-react"
import { Link } from "@/i18n/routing"
import { ApiOffer } from "@/features/offers/api"

interface FavouritesListProps {
  initialFavorites: ApiOffer[]
}

export default function FavouritesList({
  initialFavorites,
}: FavouritesListProps) {
  const t = useTranslations("Favourites")
  const { wishlist, isWishlistLoaded } = useCart()

  // Filter products by active wishlist IDs in context once wishlist is loaded on client.
  // Before wishlist is loaded, display initialFavorites from server rendering.
  const activeProducts = isWishlistLoaded
    ? initialFavorites.filter((product) => wishlist.includes(product._id))
    : initialFavorites

  if (activeProducts.length === 0) {
    return (
      <div className="flex animate-in flex-col items-center justify-center space-y-5 rounded-[24px] border border-dashed border-[#ECE6DB] bg-white p-8 py-20 text-center duration-300 fade-in dark:border-neutral-800 dark:bg-neutral-900">
        <div className="rounded-full bg-rose-50 p-5 text-rose-500 transition-colors dark:bg-rose-950/20">
          <Heart size={44} className="fill-rose-500/10 stroke-[1.5]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
            {t("empty")}
          </h3>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            {t("emptyDesc")}
          </p>
        </div>
        <Link
          href="/offers"
          className="inline-flex h-9 items-center justify-center rounded-full bg-[#7C4A27] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
        >
          <ShoppingBag className="mr-1.5 size-3.5 rtl:mr-0 rtl:ml-1.5" />
          <span>{t("backToOffers")}</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {activeProducts.map((product) => (
        <div key={product._id} className="animate-in duration-300 fade-in">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
