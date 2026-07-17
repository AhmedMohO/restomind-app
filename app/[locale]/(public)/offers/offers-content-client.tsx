"use client"

import React, { useState, useMemo } from "react"
import { MOCK_PRODUCTS } from "@/features/products/data"
import { FilterState, SortOption } from "@/features/products/types"
import ProductCard from "@/features/products/components/ProductCard"
import FilterSidebar from "@/features/products/components/FilterSidebar"
import SortBar from "@/features/products/components/SortBar"
import { Filter, Search } from "lucide-react"
import { useTranslations } from "next-intl"

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  priceRange: [0, 250],
  availability: {
    inStock: false,
    outOfStock: false,
  },
  categories: [],
  tags: [],
}

export default function OffersContentClient() {
  const t = useTranslations("Offers")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState<SortOption>("default")
  const [pageSize, setPageSize] = useState<number>(12)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      if (
        filters.searchQuery &&
        !product.title
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) &&
        !product.description
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase())
      ) {
        return false
      }

      if (
        product.price < filters.priceRange[0] ||
        product.price > filters.priceRange[1]
      ) {
        return false
      }

      const { inStock, outOfStock } = filters.availability
      if (inStock || outOfStock) {
        if (inStock && !product.isAvailable) return false
        if (outOfStock && product.isAvailable) return false
      }

      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(product.category)
      ) {
        return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.price - b.price
      }
      if (sortBy === "price-desc") {
        return b.price - a.price
      }
      if (sortBy === "rating-desc") {
        return b.rating - a.rating
      }
      return 0
    })
  }, [filters, sortBy])

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, pageSize)
  }, [filteredProducts, pageSize])

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
            onFiltersChange={setFilters}
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
              <span>Filters</span>
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#ECE6DB] bg-white px-3 py-1 transition-colors dark:border-neutral-800 dark:bg-neutral-900">
              <input
                type="text"
                placeholder="Search bakery..."
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters({ ...filters, searchQuery: e.target.value })
                }
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-[#ECE6DB] bg-white px-4 py-2 transition-colors lg:flex dark:border-neutral-800 dark:bg-neutral-900">
            <input
              type="text"
              placeholder="Search by bread title, description, pastries..."
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters({ ...filters, searchQuery: e.target.value })
              }
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {mobileFilterOpen && (
            <div className="animate-in rounded-[20px] bg-[#FAF7F2] p-1 duration-200 fade-in lg:hidden dark:bg-neutral-950">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                onClear={handleClearFilters}
              />
            </div>
          )}

          <SortBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalCount={filteredProducts.length}
          />

          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-[24px] border border-dashed border-[#ECE6DB] bg-white p-8 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="dark:bg-neutral-850 rounded-full bg-[#FAF2ED] p-4 text-primary dark:text-[#E68A49]">
                <Search size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                  No baked goodies found
                </h3>
                <p className="max-w-sm text-xs text-muted-foreground">
                  We couldn&apos;t find any products matching your current
                  filters. Try resetting the price slider or category
                  selections.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="rounded-full bg-[#7C4A27] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
