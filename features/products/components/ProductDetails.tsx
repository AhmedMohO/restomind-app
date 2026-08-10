"use client"

import { useState } from "react"
import { Link } from "@/i18n/routing"
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Loader2,
  Sparkles,
  Leaf,
  Hourglass,
  Clock,
  Calendar,
} from "lucide-react"
import type { ApiOffer } from "@/features/offers/api/type"
import { useActiveOffers } from "@/features/offers/hooks"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { cn, getImageUrl } from "@/lib/utils"
import { getFreshnessInfo, formatTimeDuration } from "@/lib/freshness"
import ProductCarousel from "@/components/common/ProductCarousel"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface ProductDetailsProps {
  product: ApiOffer
}

export default function ProductDetails({
  product: rawProduct,
}: ProductDetailsProps) {
  const t = useTranslations("Offers")
  const product = rawProduct.productId
  const { addToCart, toggleWishlist, wishlist } = useCart()
  const { user, hasAnyRole } = useAuth()
  const isManagementRole = Boolean(
    user && hasAnyRole(["admin", "staff", "manager"])
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const { data: similarRes } = useActiveOffers({
    limit: 10,
    category: product.category?._id,
  })

  const similarOffers = (similarRes?.items ?? []).filter(
    (o: ApiOffer) => o._id !== rawProduct._id && o.productId._id !== product._id
  )

  const freshness = getFreshnessInfo(
    rawProduct.startDate,
    rawProduct.endDate,
    rawProduct.createdAt
  )

  if (!product) return null

  const isFavorite = wishlist.includes(rawProduct._id)
  const activePrice = rawProduct.offerPrice ?? product.discountedPrice
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

  const handleToggleWishlist = async () => {
    setIsTogglingWishlist(true)
    try {
      await toggleWishlist(rawProduct._id)
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      const success = await addToCart(rawProduct, quantity)
      if (success) {
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
      }
    } finally {
      setIsAddingToCart(false)
    }
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
      <div className="flex w-full gap-8 max-lg:flex-wrap max-lg:justify-center">
        {/* Left Side: Product Image */}
        <Image
          src={getImageUrl(product.image?.secure_url)}
          alt={product.title}
          width={600}
          height={600}
          className="aspect-[4/3] h-152 w-152 rounded-md object-cover"
        />

        {/* Right Side: Product Details */}
        <div className="flex w-full flex-col gap-4 space-y-6 py-2 text-start">
          <div className="space-y-4">
            {/* Top row: Tags and wishlist button */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {freshness.status === "peak_fresh" && (
                  <Badge className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                    <Sparkles size={12} className="me-1" />
                    {t("peakFresh")}
                  </Badge>
                )}
                {freshness.status === "fresh" && (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                    <Leaf size={12} className="me-1" />
                    {t("dailyFresh")}
                  </Badge>
                )}
                {freshness.status === "expiring_soon" && (
                  <Badge className="bg-amber-600 text-white hover:bg-amber-700">
                    <Hourglass size={12} className="me-1" />
                    {t("expiringSoon")}
                  </Badge>
                )}
                {freshness.status === "expired" && (
                  <Badge className="bg-slate-500 text-white hover:bg-slate-600">
                    <Clock size={12} className="me-1" />
                    {t("expiredFreshness")}
                  </Badge>
                )}
                {rawProduct.featured && (
                  <Badge className="bg-amber-600 text-white hover:bg-amber-700">
                    <Sparkles size={12} className="me-1" />
                    {t("featured")}
                  </Badge>
                )}
                <Badge>
                  {t("discountBadge", { percent: discountPercentage })}
                </Badge>
              </div>
              {!isManagementRole && (
                <button
                  onClick={handleToggleWishlist}
                  disabled={isTogglingWishlist}
                  className={cn(
                    "rounded-full border border-[#ECE6DB] p-2.5 transition-colors hover:bg-[#FAF7F2] disabled:pointer-events-none disabled:opacity-75 dark:border-neutral-800 dark:hover:bg-neutral-800",
                    isFavorite
                      ? "border-[#7C4A27] bg-[#FAF2ED] text-red-500 dark:bg-red-950/20"
                      : "text-muted-foreground"
                  )}
                  title={
                    isFavorite ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  {isTogglingWishlist ? (
                    <Loader2 size={20} className="animate-spin text-red-500" />
                  ) : (
                    <Heart
                      size={20}
                      className={isFavorite ? "fill-current text-red-500" : ""}
                    />
                  )}
                </button>
              )}
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

            {/* Freshness Status & Timeline Box */}
            {freshness.status !== "none" && (
              <div className="space-y-3 rounded-xl border border-[#ECE6DB] bg-[#FAF7F2]/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#7C4A27] uppercase dark:text-[#E68A49]">
                    <Clock size={14} />
                    {t("freshnessTimeline")}
                  </span>
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    {freshness.status === "expired"
                      ? t("expiredFreshness")
                      : t("remainingTime", {
                          time: formatTimeDuration(freshness.remainingMs),
                        })}
                  </span>
                </div>

                {/* Visual Gap Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        freshness.status === "peak_fresh" &&
                          "bg-gradient-to-r from-emerald-400 to-emerald-600",
                        freshness.status === "fresh" && "bg-emerald-500",
                        freshness.status === "expiring_soon" &&
                          "animate-pulse bg-gradient-to-r from-amber-500 to-orange-500",
                        freshness.status === "expired" && "bg-slate-400"
                      )}
                      style={{
                        width: `${Math.round(freshness.remainingPercent)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      {t("freshnessProgress", {
                        percent: Math.round(freshness.remainingPercent),
                      })}
                    </span>
                    <span>
                      {t("freshnessWindow")}:{" "}
                      {formatTimeDuration(freshness.totalWindowMs)}
                    </span>
                  </div>
                </div>

                {/* Dates breakdown */}
                <div className="grid grid-cols-2 gap-2 border-t border-[#ECE6DB]/60 pt-1 text-xs dark:border-neutral-800/60">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar size={12} />
                      {t("activeDate")}
                    </span>
                    <span className="font-medium text-foreground">
                      {freshness.startDate
                        ? freshness.startDate.toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col text-end">
                    <span className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                      <Clock size={12} />
                      {t("freshUntil")}
                    </span>
                    <span className="font-medium text-foreground">
                      {freshness.expiryDate
                        ? freshness.expiryDate.toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Quantity Selector & Add to cart button */}
          {!isManagementRole && (
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
                disabled={!product.isAvailable || isAddingToCart}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-semibold shadow-sm transition-all active:translate-y-px disabled:pointer-events-none disabled:opacity-75",
                  product.isAvailable
                    ? added
                      ? "bg-[#529E66] text-white hover:bg-[#438353]"
                      : "bg-[#7C4A27] text-[#FFFFFF] hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
                    : "cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600"
                )}
              >
                {isAddingToCart ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShoppingCart size={16} />
                )}
                <span>
                  {added
                    ? t("addedToCart")
                    : t("addToCartPrice", {
                        price: (activePrice * quantity).toLocaleString(),
                      })}
                </span>
              </button>
            </div>
          )}
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
