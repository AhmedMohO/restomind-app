"use client"

import React, { useMemo, useState } from "react"
import type { GetActiveOffersParams, PaginatedOffers } from "@/features/offers/api/type"
import { useActiveOffers } from "@/features/offers/hooks"
import { FilterState, SortOption } from "@/features/products/types"
import ProductCard from "@/features/products/components/ProductCard"
import FilterSidebar from "@/features/products/components/FilterSidebar"
import SortBar from "@/features/products/components/SortBar"
import { Pagination } from "@/components/ui/pagination"
import { Filter, Search, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface OffersContentClientProps {
  initialPage?: PaginatedOffers
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  priceRange: [0, 500],
  categories: [],
  tags: [],
  isBestseller: false,
  featuredOnly: false,
  minDiscount: 0,
}

export default function OffersContentClient({ initialPage }: OffersContentClientProps) {
  const t = useTranslations("Offers")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState<SortOption>("default")
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [page, setPage] = useState(initialPage?.page ?? 1)
  const [limit, setLimit] = useState(initialPage?.limit ?? 12)

  // Fetch all active offers from API (large limit to enable client-side filter)
  const queryParams: GetActiveOffersParams = useMemo(() => ({
    page: 1,
    limit: 100,
  }), [])

  const { data, isLoading } = useActiveOffers(queryParams, initialPage)

  const rawOffers = data?.items ?? []

  // Reactive Client-side Filter
  const filteredOffers = useMemo(() => {
    return rawOffers.filter((offer) => {
      const prod = offer.productId as any
      const rest = offer.restaurantId as any

      // 1. Search Query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase()
        const titleMatch = prod?.title?.toLowerCase().includes(q)
        const descMatch = prod?.description?.toLowerCase().includes(q)
        const restMatch = rest?.name?.toLowerCase().includes(q)
        if (!titleMatch && !descMatch && !restMatch) return false
      }

      // 2. Price Range
      const price = prod?.discountedPrice ?? prod?.price ?? 0
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false
      }

      // 3. Categories
      if (filters.categories && filters.categories.length > 0) {
        const prodCat = prod?.category
        const catId = typeof prodCat === "object" ? prodCat?._id : prodCat
        const catName = typeof prodCat === "object" ? prodCat?.name : prodCat
        const matchesCat = filters.categories.some(
          (c) => c === catId || c === catName
        )
        if (!matchesCat) return false
      }

      // 4. Tags
      if (filters.tags && filters.tags.length > 0) {
        const prodTags: string[] = prod?.tags ?? []
        const hasTag = filters.tags.some((t) => prodTags.includes(t))
        if (!hasTag) return false
      }

      // 5. Bestseller Only
      if (filters.isBestseller) {
        if (!prod?.isBestseller) return false
      }

      // 6. Featured Offers Only
      if (filters.featuredOnly) {
        if (!offer.featured) return false
      }

      // 7. Minimum Discount
      if (filters.minDiscount && filters.minDiscount > 0) {
        if ((offer.discountPercentage ?? 0) < filters.minDiscount) return false
      }

      return true
    })
  }, [rawOffers, filters])

  // Sorting
  const sortedOffers = useMemo(() => {
    const list = [...filteredOffers]
    if (sortBy === "price-asc") {
      list.sort(
        (a, b) =>
          ((a.productId as any)?.discountedPrice ?? 0) -
          ((b.productId as any)?.discountedPrice ?? 0)
      )
    } else if (sortBy === "price-desc") {
      list.sort(
        (a, b) =>
          ((b.productId as any)?.discountedPrice ?? 0) -
          ((a.productId as any)?.discountedPrice ?? 0)
      )
    } else if (sortBy === "rating-desc") {
      list.sort(
        (a, b) =>
          ((b.productId as any)?.rating ?? b.discountPercentage ?? 0) -
          ((a.productId as any)?.rating ?? a.discountPercentage ?? 0)
      )
    }
    return list
  }, [filteredOffers, sortBy])

  const totalCount = sortedOffers.length
  const totalPages = Math.ceil(totalCount / limit) || 1
  const displayedOffers = useMemo(() => {
    const start = (page - 1) * limit
    return sortedOffers.slice(start, start + limit)
  }, [sortedOffers, page, limit])

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const handleSearchChange = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }))
    setPage(1)
  }

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setPage(1)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-1.5 py-2 text-start">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#2B1B15] sm:text-4xl dark:text-neutral-100">
          {t("title")}
        </h1>
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        <aside className="sticky top-4 hidden lg:col-span-1 lg:block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </aside>

        <section className="space-y-6 lg:col-span-3">
          <div className="flex gap-3 lg:hidden">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-[#ECE6DB] bg-white px-4 py-2 text-xs font-semibold tracking-wider text-primary uppercase transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-[#E68A49]"
            >
              <Filter size={16} />
              <span>{t("filters")}</span>
            </button>
            <div className="relative flex flex-1 items-center rounded-xl border border-[#ECE6DB] bg-white px-3 py-1 transition-colors dark:border-neutral-800 dark:bg-neutral-900">
              <Search size={16} className="me-2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchPlaceholderShort")}
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-[#ECE6DB] bg-white px-4 py-2 transition-colors lg:flex dark:border-neutral-800 dark:bg-neutral-900">
            <Search size={18} className="me-2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {mobileFilterOpen && (
            <div className="animate-in rounded-[20px] bg-[#FAF7F2] p-1 duration-200 fade-in lg:hidden dark:bg-neutral-950">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClear={handleClearFilters}
              />
            </div>
          )}

          <SortBar
            sortBy={sortBy}
            onSortChange={handleSortChange}
            pageSize={limit}
            onPageSizeChange={handleLimitChange}
            totalCount={totalCount}
          />

          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : displayedOffers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {displayedOffers.map((offer) => (
                  <ProductCard key={offer._id} product={offer} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="pt-4"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-[24px] border border-dashed border-[#ECE6DB] bg-white p-8 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="dark:bg-neutral-850 rounded-full bg-[#FAF2ED] p-4 text-primary dark:text-[#E68A49]">
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
              <button
                onClick={handleClearFilters}
                className="rounded-full bg-[#7C4A27] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
              >
                {t("clearAllFilters")}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
