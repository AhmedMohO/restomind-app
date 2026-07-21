"use client"

import React, { useMemo, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter, usePathname, Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import {
  Search,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ProductCard,
  ProductFilterSidebar,
  ActiveFilters,
  ProductsFilterBar,
} from "@/features/products/components"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { ApiOffer } from "@/features/offers/api/type"
import type { ApiCategory } from "@/features/categories/api/type"
import type { ApiRestaurant } from "@/features/orders/api/type"

interface OffersContentClientProps {
  initialOffers: ApiOffer[]
  allCategories: ApiCategory[]
}

const getPageNumbers = (current: number, totalPages: number) => {
  const pages: (number | string)[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push("...")

    const start = Math.max(2, current - 1)
    const end = Math.min(totalPages - 1, current + 1)
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i)
    }

    if (current < totalPages - 2) pages.push("...")
    if (!pages.includes(totalPages)) pages.push(totalPages)
  }
  return pages
}

export function OffersContentClient({
  initialOffers,
  allCategories,
}: OffersContentClientProps) {
  const t = useTranslations("Offers")
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // 1. URL Query Parameter String Primitives
  const categoriesParam = searchParams.get("categories") || ""
  const tagsParam = searchParams.get("tags") || ""
  const isBestseller = searchParams.get("bestseller") === "true"
  const featuredOnly = searchParams.get("featured") === "true"
  const minDiscountParam = Number(searchParams.get("minDiscount")) || 0
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : 0
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : 500
  const q = searchParams.get("q") || ""
  const sort = searchParams.get("sort") || "default"
  const pageParam = Number(searchParams.get("page")) || 1
  const limitParam = Number(searchParams.get("limit")) || 12

  // Memoize active array primitives to ensure stable useMemo dependencies
  const activeCategories = useMemo(
    () => categoriesParam.split(",").filter(Boolean),
    [categoriesParam]
  )
  const activeTags = useMemo(
    () => tagsParam.split(",").filter(Boolean),
    [tagsParam]
  )

  // 2. Extract available tags from initialOffers (strongly typed)
  const availableTags = useMemo(() => {
    return Array.from(
      new Set(initialOffers.flatMap((offer) => offer.productId?.tags ?? []))
    ).filter((tag): tag is string => typeof tag === "string" && Boolean(tag))
  }, [initialOffers])

  // 3. Extract available categories from initialOffers (strongly typed)
  const availableCategoryIds = useMemo(() => {
    return Array.from(
      new Set(
        initialOffers
          .flatMap((offer) => {
            const cat = offer.productId?.category
            if (!cat) return []
            if (typeof cat === "object")
              return [cat._id, cat.name].filter(Boolean)
            return [cat]
          })
          .filter((c): c is string => typeof c === "string" && Boolean(c))
      )
    )
  }, [initialOffers])

  const availableCategories = useMemo(() => {
    if (availableCategoryIds.length === 0) return allCategories
    return allCategories.filter(
      (cat) =>
        availableCategoryIds.includes(cat._id) ||
        availableCategoryIds.includes(cat.name)
    )
  }, [allCategories, availableCategoryIds])

  // 4. Reactive Filtering over initialOffers (strongly typed)
  const filteredOffers = useMemo(() => {
    return initialOffers.filter((offer) => {
      const prod = offer.productId
      const rest = offer.restaurantId as ApiRestaurant | string | undefined

      // Search Query
      if (q) {
        const query = q.toLowerCase()
        const titleMatch = prod?.title?.toLowerCase().includes(query)
        const descMatch = prod?.description?.toLowerCase().includes(query)
        const restName = typeof rest === "object" ? rest?.name : undefined
        const restMatch = restName?.toLowerCase().includes(query)
        if (!titleMatch && !descMatch && !restMatch) return false
      }

      // Price Range
      const price = prod?.discountedPrice ?? prod?.price ?? 0
      if (price < minPrice || price > maxPrice) {
        return false
      }

      // Categories
      if (activeCategories.length > 0) {
        const prodCat = prod?.category
        const catId = typeof prodCat === "object" ? prodCat?._id : prodCat
        const catName = typeof prodCat === "object" ? prodCat?.name : prodCat
        const matchesCat = activeCategories.some(
          (c) => c === catId || c === catName
        )
        if (!matchesCat) return false
      }

      // Tags
      if (activeTags.length > 0) {
        const prodTags: string[] = prod?.tags ?? []
        const hasTag = activeTags.some((tag) => prodTags.includes(tag))
        if (!hasTag) return false
      }

      // Bestseller Only
      if (isBestseller && !prod?.isBestseller) {
        return false
      }

      // Featured Offers Only
      if (featuredOnly && !offer.featured) {
        return false
      }

      // Minimum Discount
      if (
        minDiscountParam > 0 &&
        (offer.discountPercentage ?? 0) < minDiscountParam
      ) {
        return false
      }

      return true
    })
  }, [
    initialOffers,
    q,
    minPrice,
    maxPrice,
    activeCategories,
    activeTags,
    isBestseller,
    featuredOnly,
    minDiscountParam,
  ])

  // 5. Sorting (strongly typed)
  const sortedOffers = useMemo(() => {
    const list = [...filteredOffers]
    if (sort === "price-asc") {
      list.sort(
        (a, b) =>
          (a.productId?.discountedPrice ?? 0) -
          (b.productId?.discountedPrice ?? 0)
      )
    } else if (sort === "price-desc") {
      list.sort(
        (a, b) =>
          (b.productId?.discountedPrice ?? 0) -
          (a.productId?.discountedPrice ?? 0)
      )
    } else if (sort === "rating-desc") {
      list.sort(
        (a, b) =>
          (b.productId?.rating ?? b.discountPercentage ?? 0) -
          (a.productId?.rating ?? a.discountPercentage ?? 0)
      )
    }
    return list
  }, [filteredOffers, sort])

  // 6. Pagination Calculations
  const totalCount = sortedOffers.length
  const totalPages = Math.ceil(totalCount / limitParam) || 1
  const startIdx = (pageParam - 1) * limitParam
  const displayedOffers = useMemo(() => {
    return sortedOffers.slice(startIdx, startIdx + limitParam)
  }, [sortedOffers, startIdx, limitParam])

  const pageNumbers = getPageNumbers(pageParam, totalPages)

  const buildUrlWithPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(p))
    }
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ""}`
  }

  const handlePageChange = (p: number) => {
    startTransition(() => {
      router.push(buildUrlWithPage(p), { scroll: true })
    })
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/20 py-2 md:flex-row md:items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#2B1B15] sm:text-4xl dark:text-neutral-100">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {t("subtitle")}
          </p>
        </div>

        {/* Mobile Filter Drawer Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="h-10 gap-1.5 rounded-xl border-[#ECE6DB] px-4 text-xs tracking-wider uppercase dark:border-neutral-800"
                >
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span>{t("filters")}</span>
                </Button>
              }
            />
            <SheetContent
              side="left"
              className="w-80 overflow-y-auto p-4 pt-10"
            >
              <ProductFilterSidebar
                availableCategories={availableCategories}
                availableTags={availableTags}
                startTransition={startTransition}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 2-Column Sidebar & Grid Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Desktop Left Sidebar */}
        <aside className="sticky top-4 hidden max-h-[calc(100vh-8rem)] scrollbar-thin overflow-y-auto lg:col-span-1 lg:block">
          <ProductFilterSidebar
            availableCategories={availableCategories}
            availableTags={availableTags}
            startTransition={startTransition}
          />
        </aside>

        {/* Right Content Area */}
        <section className="min-w-0 space-y-6 lg:col-span-3">
          <ProductsFilterBar startTransition={startTransition} />

          <ActiveFilters availableCategories={allCategories} />

          <div className="relative">
            {/* Smooth Overlay on Transition */}
            {isPending && (
              <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-white/40 pt-20 backdrop-blur-[1px] dark:bg-neutral-950/40">
                <div className="flex items-center gap-2 rounded-full border border-[#ECE6DB] bg-white px-4 py-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Updating...
                  </span>
                </div>
              </div>
            )}

            {displayedOffers.length > 0 ? (
              <>
                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 transition-opacity duration-200 sm:grid-cols-2 md:grid-cols-3",
                    isPending && "opacity-50"
                  )}
                >
                  {displayedOffers.map((offer) => (
                    <ProductCard key={offer._id} product={offer} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-[#ECE6DB] pt-8 dark:border-neutral-800">
                    <Link
                      href={buildUrlWithPage(pageParam - 1)}
                      onClick={(e) => {
                        e.preventDefault()
                        if (pageParam > 1) handlePageChange(pageParam - 1)
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECE6DB] bg-white text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900",
                        pageParam === 1 && "pointer-events-none opacity-30"
                      )}
                    >
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    </Link>

                    {pageNumbers.map((p, idx) =>
                      p === "..." ? (
                        <span
                          key={`dots-${idx}`}
                          className="flex h-9 w-9 items-center justify-center text-xs text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Link
                          key={`page-${p}`}
                          href={buildUrlWithPage(p as number)}
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(p as number)
                          }}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-colors",
                            p === pageParam
                              ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                              : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900"
                          )}
                        >
                          {p}
                        </Link>
                      )
                    )}

                    <Link
                      href={buildUrlWithPage(pageParam + 1)}
                      onClick={(e) => {
                        e.preventDefault()
                        if (pageParam < totalPages)
                          handlePageChange(pageParam + 1)
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECE6DB] bg-white text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900",
                        pageParam === totalPages &&
                          "pointer-events-none opacity-30"
                      )}
                    >
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-[24px] border border-dashed border-[#ECE6DB] bg-white p-8 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <div className="rounded-full bg-[#FAF2ED] p-4 text-primary dark:bg-neutral-800 dark:text-[#E68A49]">
                  <Search size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                    {t("noProductsFound")}
                  </h3>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {t("noProductsDesc")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
