"use client"

// import React, { useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import ProductCard from "@/features/products/components/ProductCard"
// import { fetchProductsAction } from "@/features/products/actions"
import type { ApiProduct } from "@/features/products/api/type"

interface ProductCarouselProps {
  products?: ApiProduct[]
  category?: string
  excludeId?: string
  title: string
  subtitle?: string
  limit?: number
  className?: string
}

  // function mapApiProductToProduct(apiProd: ApiProduct): ApiProduct {
  //   const categoryName =
  //     typeof apiProd.category === "object" && apiProd.category !== null
  //       ? (apiProd.category as { name: string }).name
  //       : String(apiProd.category || "General")

  //   return {
  //     id: apiProd._id,
  //     title: apiProd.title,
  //     description: apiProd.description,
  //     longDescription: apiProd.longDescription,
  //     price: apiProd.discountedPrice ?? apiProd.price,
  //     rating: apiProd.rating ?? 0,
  //     reviewsCount: apiProd.reviewsCount ?? 0,
  //     isBestseller: apiProd.isBestseller ?? false,
  //     isAvailable: apiProd.isAvailable ?? true,
  //     image:
  //       apiProd.image?.secure_url ||
  //       "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80",
  //     category: categoryName,
  //     prepTime: "15 min",
  //     calories: 250,
  //     freshnessWindow: apiProd.freshnessWindow || 24,
  //     tags: apiProd.tags || [],
  //   }
  // }

export default function ProductCarousel({
  products = [],
  category,
  excludeId,
  title,
  subtitle,
  limit = 8,
  className,
}: ProductCarouselProps) {
  
  let displayProducts = products;

  if (category) {
    displayProducts = displayProducts.filter(
      (p) => p.category.name.toLowerCase() === category.toLowerCase()
    )
  }
  if (excludeId) {
    displayProducts = displayProducts.filter((p) => p._id !== excludeId)
  }
  if (limit) {
    displayProducts = displayProducts.slice(0, limit)
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
              key={product._id}
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
