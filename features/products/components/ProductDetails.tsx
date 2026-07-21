"use client"

import React, { useState } from "react"
import { Link } from "@/i18n/routing"
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus, Star } from "lucide-react"
import type { ApiOffer } from "@/features/offers/api/type"
import { useActiveOffers } from "@/features/offers/hooks"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"
import ProductCarousel from "@/components/common/ProductCarousel"
import { useTranslations } from "next-intl"
import Image from "next/image"

interface ProductDetailsProps {
  product: ApiOffer
}

export default function ProductDetails({
  product: rawProduct,
}: ProductDetailsProps) {
  const t = useTranslations("Offers")
  const product = rawProduct.productId
  const { addToCart, toggleWishlist, wishlist } = Object(useCart())
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { data: similarRes } = useActiveOffers({
    limit: 10,
    category: product.category?._id,
    sort: "price",
    order: "asc",
  })

  const similarOffers = (similarRes?.items ?? []).filter(
    (o: ApiOffer) => o._id !== rawProduct._id && o.productId._id !== product._id
  )

  if (!product) return null

  const isFavorite = wishlist.includes(product._id)
  const activePrice = product.discountedPrice
  const discountPercentage = rawProduct.discountPercentage || 0

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "Bread":
        return t("categoryBread")
      case "Pastry":
        return t("categoryPastry")
      case "Cookies":
        return t("categoryCookies")
      case "Desserts":
        return t("categoryDesserts")
      default:
        return cat
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleIncrement = () => {
    setQuantity(quantity + 1)
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="container mx-auto space-y-6 px-4">
      {/* Back to shop breadcrumb button */}
      <div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C4A27] hover:underline dark:text-[#E68A49]"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          <span>{t("backToOffers")}</span>
        </Link>
      </div>

      {/* Main product view split layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left Side: Product Image */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#ECE6DB] bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="dark:bg-neutral-850 aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-[#FAF7F2] md:aspect-square">
            <Image
              src={product.image?.secure_url || "/placeholder.svg"}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col gap-4 space-y-6 py-2 text-start">
          <div className="space-y-4">
            {/* Top row: Tags and wishlist button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#E2F7EB] px-3 py-1 text-xs font-semibold text-[#2F6D44] dark:bg-emerald-950/30 dark:text-emerald-400">
                  {t("dailyFresh")}
                </span>
                <span className="rounded-full bg-[#7C4A27] px-3 py-1 text-xs font-bold text-white uppercase dark:bg-[#C2733C]">
                  {t("discountBadge", { percent: discountPercentage })}
                </span>
              </div>
              <button
                onClick={() => toggleWishlist(product._id)}
                className={cn(
                  "rounded-full border border-[#ECE6DB] p-2.5 transition-colors hover:bg-[#FAF7F2] dark:border-neutral-800 dark:hover:bg-neutral-800",
                  isFavorite
                    ? "border-[#7C4A27] bg-[#FAF2ED] text-red-500 dark:bg-red-950/20"
                    : "text-muted-foreground"
                )}
                title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={20}
                  className={isFavorite ? "fill-current text-red-500" : ""}
                />
              </button>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl leading-tight font-bold text-[#2B1B15] md:text-4xl dark:text-neutral-100">
              {product.title}
            </h1>

            {/* Stars rating & reviews count */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-[#D7A977]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={cn(
                      i < Math.floor(product.rating ?? 5)
                        ? "fill-current"
                        : "opacity-30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-[#2B1B15] dark:text-neutral-300">
                {product.rating ?? 5}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("reviews", { count: product.reviewsCount ?? 0 })}
              </span>
            </div>

            {/* Large Price Display */}
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-[#2B1B15] dark:text-neutral-100">
                {activePrice} {t("egp")}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {product.price} {t("egp")}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.longDescription || product.description}
            </p>
          </div>

          {/* Action Row: Quantity Selector & Add to cart button */}
          <div className="flex flex-col gap-4 border-t border-[#ECE6DB] pt-4 sm:flex-row dark:border-neutral-800">
            {/* Quantity control */}
            <div className="flex min-w-[120px] items-center justify-between rounded-full border border-[#ECE6DB] bg-white px-2 py-1.5 sm:w-fit dark:border-neutral-800 dark:bg-neutral-900">
              <button
                onClick={handleDecrement}
                disabled={!product.isAvailable}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-[#FAF7F2] disabled:opacity-50 dark:hover:bg-neutral-800"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 text-sm font-bold text-[#2B1B15] dark:text-neutral-200">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={!product.isAvailable}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-[#FAF7F2] disabled:opacity-50 dark:hover:bg-neutral-800"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add to cart brown button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-semibold shadow-sm transition-all active:translate-y-px",
                product.isAvailable
                  ? added
                    ? "bg-[#529E66] text-white hover:bg-[#438353]"
                    : "bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
                  : "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600"
              )}
            >
              <ShoppingCart size={16} />
              <span>
                {added
                  ? t("addedToCart")
                  : t("addToCartPrice", {
                      price: (activePrice * quantity).toLocaleString(),
                    })}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Similar offers carousel */}
      {similarOffers.length > 0 && (
        <div className="mt-12 border-t border-[#ECE6DB] pt-12 transition-colors dark:border-neutral-800">
          <ProductCarousel
            products={similarOffers}
            title={t("similarTitle")}
            subtitle={t("similarSubtitle", {
              category: getCategoryLabel(product.category?.name || ""),
            })}
          />
        </div>
      )}
    </div>
  )
}
