"use client"

import React, { useState } from "react"
import { Link, useRouter } from "@/i18n/routing"
import { Plus, Heart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useTranslations } from "next-intl"
import type { ApiOffer } from "@/features/offers/api/type"

interface ProductCardProps {
  product: ApiOffer
}

export default function ProductCard({ product: rawProduct }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const t = useTranslations("Offers")

  if (!rawProduct) return null

  const product = rawProduct.productId
  const isFavorite = wishlist.includes(rawProduct._id)
  const discountedPrice = rawProduct.offerPrice ?? product.discountedPrice
  const discountPercentage = rawProduct.discountPercentage || 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Auth guard check: redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    addToCart(rawProduct, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(rawProduct._id)
  }

  const detailSlug = product.slug

  return (
    <div className="group flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-[#ECE6DB] bg-white shadow-sm transition-all duration-350 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Link href={`/offers/${detailSlug}`} className="block">
        {/* Product Image Container (extends to edges of the card) */}
        <div className="dark:bg-neutral-850 relative aspect-[4/3] w-full overflow-hidden bg-[#FAF7F2]">
          <Image
            src={product.image?.secure_url || "/placeholder.svg"}
            alt={product.title}
            fill
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Badges Container: Offer Discount percentage & Bestseller */}
          <div className="absolute start-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
            {discountPercentage > 0 && (
              <span className="rounded-full bg-[#7C4A27] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm dark:bg-[#C2733C]">
                {t("discountBadge", { percent: discountPercentage })}
              </span>
            )}

            {product.isBestseller && (
              <span className="rounded-full bg-[#E6BF8F] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#2B1B15] uppercase shadow-sm">
                {t("bestseller")}
              </span>
            )}
          </div>
          {/* Wishlist Toggle Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute end-3 top-3 z-20 cursor-pointer rounded-full border bg-white/95 p-2 shadow-sm backdrop-blur-xs transition-all hover:scale-105 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900/95",
              isFavorite
                ? "border-rose-100 text-rose-500 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/20"
                : "dark:hover:bg-neutral-850 border-[#ECE6DB] text-muted-foreground hover:bg-neutral-50 dark:border-neutral-800"
            )}
            title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={14}
              className={isFavorite ? "fill-current text-rose-500" : ""}
            />
          </button>
        </div>

        {/* Info Area (with padding) */}
        <div className="space-y-2 p-4 pb-0 text-start">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg leading-tight font-bold text-[#2B1B15] transition-colors group-hover:text-primary dark:text-neutral-100 dark:group-hover:text-[#E68A49]">
              {product.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1 text-[#D7A977]">
              <span className="text-xs font-bold text-[#2B1B15] dark:text-neutral-300">
                {product.rating}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {/* Price & Availability */}
          <div className="flex items-center justify-between border-t border-dashed border-[#ECE6DB] pt-1 dark:border-neutral-800">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-base font-bold text-[#2B1B15] dark:text-neutral-100">
                {discountedPrice} {t("egp")}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {product.price} {t("egp")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  product.isAvailable ? "bg-[#529E66]" : "bg-[#C45E5E]"
                )}
              />
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {product.isAvailable ? t("available") : t("outOfStock")}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Action Button (with padding) */}
      <div className="p-4 pt-3">
        <button
          onClick={handleAddToCart}
          disabled={!product.isAvailable}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 font-sans text-sm font-semibold shadow-sm transition-all active:translate-y-px",
            product.isAvailable
              ? added
                ? "bg-[#529E66] text-white hover:bg-[#438353]"
                : "bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
              : "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600"
          )}
        >
          <Plus size={16} />
          <span>{added ? t("added") : t("addToCart")}</span>
        </button>
      </div>
    </div>
  )
}
