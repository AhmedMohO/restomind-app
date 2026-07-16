"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Star, Plus, Heart } from "lucide-react"
import { Product } from "./types"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useCart()
  const [added, setAdded] = useState(false)

  const isFavorite = wishlist.includes(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#ECE6DB] bg-white shadow-sm transition-all duration-350 hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Link href={`/offers/${product.id}`} className="block">
        {/* Product Image Container (extends to edges of the card) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF7F2] dark:bg-neutral-850">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Bestseller Badge */}
          {product.isBestseller && (
            <span className="absolute top-3 start-3 bg-[#E6BF8F] text-[#2B1B15] text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider shadow-sm uppercase">
              Bestseller
            </span>
          )}
          {/* Wishlist Toggle Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-3 end-3 z-20 p-2 rounded-full border bg-white/95 backdrop-blur-xs transition-all hover:scale-105 active:scale-95 shadow-sm dark:bg-neutral-900/95 dark:border-neutral-800 cursor-pointer",
              isFavorite
                ? "border-rose-100 text-rose-500 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/20"
                : "border-[#ECE6DB] text-muted-foreground hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-850"
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
        <div className="p-4 pb-0 space-y-2">
          {/* Title & Rating */}
          <div className="flex items-start justify-between">
            <h3 className="font-serif text-lg font-bold leading-tight text-[#2B1B15] dark:text-neutral-100 group-hover:text-primary dark:group-hover:text-[#E68A49] transition-colors">
              {product.title}
            </h3>
            <div className="flex items-center gap-1 text-[#D7A977]">
              <Star size={16} className="fill-current" />
              <span className="text-xs font-bold text-[#2B1B15] dark:text-neutral-300">
                {product.rating}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>

          {/* Price & Availability */}
          <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#ECE6DB] dark:border-neutral-800">
            <span className="font-serif text-base font-bold text-[#2B1B15] dark:text-neutral-100">
              {product.price} EGP
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  product.isAvailable ? "bg-[#529E66]" : "bg-[#C45E5E]"
                )}
              />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {product.isAvailable ? "Available" : "Out of stock"}
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
            "flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 font-sans text-sm font-semibold transition-all shadow-sm active:translate-y-px cursor-pointer",
            product.isAvailable
              ? added
                ? "bg-[#529E66] text-white hover:bg-[#438353]"
                : "bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600"
          )}
        >
          <Plus size={16} />
          <span>{added ? "Added!" : "Add to cart"}</span>
        </button>
      </div>
    </div>
  )
}
