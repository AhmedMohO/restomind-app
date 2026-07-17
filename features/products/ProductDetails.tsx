"use client"

import React, { useState } from "react"
import { Link } from "@/i18n/routing"
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus, Star } from "lucide-react"
import { Product } from "./types"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"
import ProductCarousel from "@/components/common/ProductCarousel"

interface ProductDetailsProps {
  product: Product
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart, toggleWishlist, wishlist } = Object(useCart())
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const isFavorite = wishlist.includes(product.id)

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
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 md:px-8">
      {/* Back to shop breadcrumb button */}
      <div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C4A27] hover:underline dark:text-[#E68A49]"
        >
          <ArrowLeft size={16} />
          <span>Back to shop</span>
        </Link>
      </div>

      {/* Main product view split layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left Side: Product Image */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#ECE6DB] bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="dark:bg-neutral-850 aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-[#FAF7F2] md:aspect-square">
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col gap-4 space-y-6 py-2">
          <div className="space-y-4">
            {/* Top row: Tags and wishlist button */}
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#E2F7EB] px-3 py-1 text-xs font-semibold text-[#2F6D44] dark:bg-emerald-950/30 dark:text-emerald-400">
                Daily Fresh
              </span>
              <button
                onClick={() => toggleWishlist(product.id)}
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
                      i < Math.floor(product.rating)
                        ? "fill-current"
                        : "opacity-30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-[#2B1B15] dark:text-neutral-300">
                {product.rating}
              </span>
              <span className="text-xs text-muted-foreground">
                ({product.reviewsCount} reviews)
              </span>
            </div>

            {/* Large Price Display */}
            <div className="font-serif text-3xl font-bold text-[#2B1B15] dark:text-neutral-100">
              {product.price} EGP
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.longDescription}
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
                  ? "Added to Cart!"
                  : `Add to Cart • ${(product.price * quantity).toLocaleString()} EGP`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Similar offers carousel */}
      <div className="mt-12 border-t border-[#ECE6DB] pt-12 transition-colors dark:border-neutral-800">
        <ProductCarousel
          category={product.category}
          excludeId={product.id}
          title="Similar Delicious Offers"
          subtitle={`Warm treats from our ${product.category} section`}
        />
      </div>
    </div>
  )
}
