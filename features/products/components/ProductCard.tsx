"use client"

import React, { useState } from "react"
import { Link, useRouter } from "@/i18n/routing"
import { Plus, Heart, Star, Loader2 } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { cn, formatCurrency, getImageUrl } from "@/lib/utils"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import type { ApiOffer } from "@/features/offers/api/type"

interface ProductCardProps {
  product: ApiOffer
}

export default function ProductCard({ product: rawProduct }: ProductCardProps) {
  const locale = useLocale()
  const { addToCart, toggleWishlist, wishlist } = useCart()
  const { isAuthenticated, user, hasAnyRole } = useAuth()
  const isManagementRole = Boolean(user && hasAnyRole(["admin", "staff", "manager"]))
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const t = useTranslations("Offers")

  if (!rawProduct) return null
  const product = rawProduct.productId
  if (!product) return null
  const isFavorite = wishlist.includes(rawProduct._id)
  const discountedPrice = rawProduct.offerPrice ?? product.discountedPrice
  const discountPercentage = rawProduct.discountPercentage || 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Auth guard check: redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    setIsAddingToCart(true)
    try {
      const success = await addToCart(rawProduct, 1)
      if (success) {
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    setIsTogglingWishlist(true)
    try {
      await toggleWishlist(rawProduct._id)
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  const detailSlug = product.slug

  return (
    <div className="group flex h-full flex-col justify-between overflow-hidden rounded-md border border-[#ECE6DB] bg-white shadow-sm transition-all duration-350 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Link href={`/offers/${detailSlug}`} className="block">
        {/* Product Image Container (extends to edges of the card) */}
        <div className="dark:bg-neutral-850 relative aspect-[4/3] w-full overflow-hidden bg-[#FAF7F2]">
          <Image
            src={getImageUrl(product.image?.secure_url)}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
          {!isManagementRole && (
            <button
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              className={cn(
                "absolute end-3 top-3 z-20 cursor-pointer rounded-full border bg-white/95 p-2 shadow-sm backdrop-blur-xs transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-75 dark:border-neutral-800 dark:bg-neutral-900/95",
                isFavorite
                  ? "border-rose-100 text-rose-500 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/20"
                  : "dark:hover:bg-neutral-850 border-[#ECE6DB] text-muted-foreground hover:bg-neutral-50 dark:border-neutral-800"
              )}
              title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isTogglingWishlist ? (
                <Loader2 size={14} className="animate-spin text-rose-500" />
              ) : (
                <Heart
                  size={14}
                  className={isFavorite ? "fill-current text-rose-500" : ""}
                />
              )}
            </button>
          )}
        </div>

        {/* Info Area (with padding) */}
        <div className="space-y-2 p-4 pb-0 text-start">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg leading-tight font-bold text-[#2B1B15] transition-colors group-hover:text-primary dark:text-neutral-100 dark:group-hover:text-[#E68A49]">
              {product.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1 text-[#D7A977]">
              <Star size={12} className="fill-current text-[#D7A977]" />
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
                {formatCurrency(discountedPrice, locale)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.price, locale)}
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
      {!isManagementRole && (
        <div className="p-4 pt-3">
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAddingToCart}
            className={cn(
              "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 font-sans text-sm font-semibold shadow-sm transition-all active:translate-y-px disabled:pointer-events-none disabled:opacity-75",
              product.isAvailable
                ? added
                  ? "bg-[#529E66] text-white hover:bg-[#438353]"
                  : "bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
                : "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600"
            )}
          >
            {isAddingToCart ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            <span>{added ? t("added") : t("addToCart")}</span>
          </button>
        </div>
      )}
    </div>
  )
}
