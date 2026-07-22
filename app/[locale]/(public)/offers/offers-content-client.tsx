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
  allRestaurants?: ApiRestaurant[]
}

const getPageNumbers = (
  current: number,
  totalPages: number
): (number | string)[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = [1]
  if (current > 3) pages.push("...")

  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i)
  }

  if (current < totalPages - 2) pages.push("...")
  if (!pages.includes(totalPages)) pages.push(totalPages)

  return pages
}

export function OffersContentClient({
  initialOffers,
  allCategories,
  allRestaurants = [],
}: OffersContentClientProps) {
  const t = useTranslations("Offers")
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // 1. Parsed URL Filter State
  const filterState = useMemo(() => {
    const q = searchParams.get("q") || ""
    const sort = searchParams.get("sort") || "default"
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.max(1, Number(searchParams.get("limit")) || 12)
    const minPrice = searchParams.has("minPrice")
      ? Number(searchParams.get("minPrice"))
      : 0
    const maxPrice = searchParams.has("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : 500
    const minDiscount = Number(searchParams.get("minDiscount")) || 0
    const isBestseller = searchParams.get("bestseller") === "true"
    const featuredOnly = searchParams.get("featured") === "true"

    const categories =
      searchParams.get("categories")?.split(",").filter(Boolean) || []
    const restaurants =
      searchParams.get("restaurants")?.split(",").filter(Boolean) || []
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []

    return {
      q,
      sort,
      page,
      limit,
      minPrice,
      maxPrice,
      minDiscount,
      isBestseller,
      featuredOnly,
      categories,
      restaurants,
      tags,
    }
  }, [searchParams])

  // 2. Extract available tags from initialOffers
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const offer of initialOffers) {
      const prodTags = offer.productId?.tags
      if (Array.isArray(prodTags)) {
        for (const tag of prodTags) {
          if (tag) tagSet.add(tag)
        }
      }
    }
    return Array.from(tagSet)
  }, [initialOffers])

  // 3. Extract available restaurants from initialOffers & allRestaurants prop
  const availableRestaurants = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>()

    if (allRestaurants.length > 0) {
      for (const rest of allRestaurants) {
        if (rest?._id && rest?.name) {
          map.set(rest._id, { _id: rest._id, name: rest.name })
        }
      }
    }

    for (const offer of initialOffers) {
      const rest = offer.restaurantId as ApiRestaurant | string | undefined
      if (typeof rest === "object" && rest?._id && rest?.name) {
        map.set(rest._id, { _id: rest._id, name: rest.name })
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [initialOffers, allRestaurants])

  // 4. Extract available categories from initialOffers & allCategories
  const availableCategories = useMemo(() => {
    const categoryIdentifiers = new Set<string>()

    for (const offer of initialOffers) {
      const cat = offer.productId?.category
      if (cat) {
        if (typeof cat === "object") {
          if (cat._id) categoryIdentifiers.add(cat._id)
          if (cat.name) categoryIdentifiers.add(cat.name)
        } else if (typeof cat === "string") {
          categoryIdentifiers.add(cat)
        }
      }
    }

    if (categoryIdentifiers.size === 0) return allCategories

    return allCategories.filter(
      (cat) =>
        categoryIdentifiers.has(cat._id) || categoryIdentifiers.has(cat.name)
    )
  }, [initialOffers, allCategories])

  // 5. Reactive Filtering
  const filteredOffers = useMemo(() => {
    const {
      q,
      minPrice,
      maxPrice,
      categories,
      restaurants,
      tags,
      isBestseller,
      featuredOnly,
      minDiscount,
    } = filterState

    const searchQuery = q.trim().toLowerCase()

    return initialOffers.filter((offer) => {
      const prod = offer.productId
      const rest = offer.restaurantId as ApiRestaurant | string | undefined

      // Search Query Match (Title, Description, Restaurant Name)
      if (searchQuery) {
        const titleMatch = prod?.title?.toLowerCase().includes(searchQuery)
        const descMatch = prod?.description?.toLowerCase().includes(searchQuery)
        const restName = typeof rest === "object" ? rest?.name : undefined
        const restMatch = restName?.toLowerCase().includes(searchQuery)
        if (!titleMatch && !descMatch && !restMatch) return false
      }

      // Price Range Match
      const price = prod?.discountedPrice ?? prod?.price ?? 0
      if (price < minPrice || price > maxPrice) return false

      // Categories Filter Match
      if (categories.length > 0) {
        const prodCat = prod?.category
        const catId = typeof prodCat === "object" ? prodCat?._id : prodCat
        const catName = typeof prodCat === "object" ? prodCat?.name : prodCat
        const matchesCat = categories.some((c) => c === catId || c === catName)
        if (!matchesCat) return false
      }

      // Restaurants Filter Match
      if (restaurants.length > 0) {
        const restId = typeof rest === "object" ? rest?._id : rest
        const restName = typeof rest === "object" ? rest?.name : undefined
        const matchesRest = restaurants.some(
          (r) => r === restId || r === restName
        )
        if (!matchesRest) return false
      }

      // Tags Filter Match
      if (tags.length > 0) {
        const prodTags = prod?.tags ?? []
        const hasTag = tags.some((t) => prodTags.includes(t))
        if (!hasTag) return false
      }

      // Bestseller Only Match
      if (isBestseller && !prod?.isBestseller) return false

      // Featured Offers Only Match
      if (featuredOnly && !offer.featured) return false

      // Minimum Discount Match
      if (minDiscount > 0 && (offer.discountPercentage ?? 0) < minDiscount) {
        return false
      }

      return true
    })
  }, [initialOffers, filterState])

  // 6. Sorting
  const sortedOffers = useMemo(() => {
    const list = [...filteredOffers]

    switch (filterState.sort) {
      case "price-asc":
        return list.sort(
          (a, b) =>
            (a.productId?.discountedPrice ?? 0) -
            (b.productId?.discountedPrice ?? 0)
        )
      case "price-desc":
        return list.sort(
          (a, b) =>
            (b.productId?.discountedPrice ?? 0) -
            (a.productId?.discountedPrice ?? 0)
        )
      case "rating-desc":
        return list.sort(
          (a, b) =>
            (b.productId?.rating ?? b.discountPercentage ?? 0) -
            (a.productId?.rating ?? a.discountPercentage ?? 0)
        )
      default:
        return list
    }
  }, [filteredOffers, filterState.sort])

  // 7. Pagination
  const totalCount = sortedOffers.length
  const totalPages = Math.ceil(totalCount / filterState.limit) || 1
  const startIdx = (filterState.page - 1) * filterState.limit

  const displayedOffers = useMemo(() => {
    return sortedOffers.slice(startIdx, startIdx + filterState.limit)
  }, [sortedOffers, startIdx, filterState.limit])

  const pageNumbers = getPageNumbers(filterState.page, totalPages)

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
                availableRestaurants={availableRestaurants}
                startTransition={startTransition}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 2-Column Sidebar & Grid Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Desktop Left Sidebar */}
        <aside className="sticky top-4 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:col-span-1 lg:block">
          <ProductFilterSidebar
            availableCategories={availableCategories}
            availableTags={availableTags}
            availableRestaurants={availableRestaurants}
            startTransition={startTransition}
          />
        </aside>

        {/* Right Content Area */}
        <section className="min-w-0 space-y-6 lg:col-span-3">
          <ProductsFilterBar startTransition={startTransition} />

          <ActiveFilters
            availableCategories={allCategories}
            availableRestaurants={availableRestaurants}
          />

          <div className="relative">
            {/* Transition Loading Overlay */}
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-[#ECE6DB] pt-8 dark:border-neutral-800">
                    <Link
                      href={buildUrlWithPage(filterState.page - 1)}
                      onClick={(e) => {
                        e.preventDefault()
                        if (filterState.page > 1)
                          handlePageChange(filterState.page - 1)
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECE6DB] bg-white text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900",
                        filterState.page === 1 &&
                          "pointer-events-none opacity-30"
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
                            p === filterState.page
                              ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                              : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900"
                          )}
                        >
                          {p}
                        </Link>
                      )
                    )}

                    <Link
                      href={buildUrlWithPage(filterState.page + 1)}
                      onClick={(e) => {
                        e.preventDefault()
                        if (filterState.page < totalPages)
                          handlePageChange(filterState.page + 1)
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECE6DB] bg-white text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900",
                        filterState.page === totalPages &&
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
