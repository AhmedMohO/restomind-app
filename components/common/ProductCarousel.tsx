"use client"

import React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import ProductCard from "@/features/products/components/ProductCard"
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
        <div className="mb-6 flex items-end justify-between px-1">
          <div className="space-y-1.5 text-start">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#2B1B15] sm:text-3xl dark:text-neutral-100">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation buttons wrapper */}
          <div className="relative flex h-9 w-20 shrink-0 items-center gap-2">
            <CarouselPrevious className="relative top-0 right-0 left-0 flex size-9 translate-y-0 cursor-pointer items-center justify-center" />
            <CarouselNext className="relative top-0 right-0 left-0 flex size-9 translate-y-0 cursor-pointer items-center justify-center" />
          </div>
        </div>

        <CarouselContent className="gap-6 pb-4">
          {displayProducts.map((product) => (
            <CarouselItem
              key={product.id}
              className="w-[280px] shrink-0 snap-start sm:w-[320px]"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
