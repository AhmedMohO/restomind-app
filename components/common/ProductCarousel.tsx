"use client"

import React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import ProductCard from "@/features/products/ProductCard"
import { MOCK_PRODUCTS } from "@/features/products/data"
import { Product } from "@/features/products/types"

interface ProductCarouselProps {
  products?: Product[]
  category?: string
  excludeId?: string
  title: string
  subtitle?: string
  limit?: number
  className?: string
}

export default function ProductCarousel({
  products,
  category,
  excludeId,
  title,
  subtitle,
  limit,
  className,
}: ProductCarouselProps) {
  // Use passed products or fallback to MOCK_PRODUCTS with filtering
  let displayProducts = products ? [...products] : [...MOCK_PRODUCTS]

  if (!products) {
    if (category) {
      displayProducts = displayProducts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      )
    }
    if (excludeId) {
      displayProducts = displayProducts.filter((p) => p.id !== excludeId)
    }
    if (limit) {
      displayProducts = displayProducts.slice(0, limit)
    }
  }

  if (displayProducts.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <Carousel className="w-full">
        <div className="flex items-end justify-between mb-6 px-1">
          <div className="space-y-1.5 text-start">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1B15] dark:text-neutral-100">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation buttons wrapper */}
          <div className="flex items-center gap-2 relative h-9 w-20 shrink-0">
            <CarouselPrevious className="relative left-0 right-0 top-0 translate-y-0 size-9 flex items-center justify-center cursor-pointer" />
            <CarouselNext className="relative left-0 right-0 top-0 translate-y-0 size-9 flex items-center justify-center cursor-pointer" />
          </div>
        </div>

        <CarouselContent className="gap-6 pb-4">
          {displayProducts.map((product) => (
            <CarouselItem
              key={product.id}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
