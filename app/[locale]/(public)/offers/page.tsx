"use client"

import React, { useState, useMemo } from "react"
import { MOCK_PRODUCTS } from "@/features/products/data"
import { FilterState, SortOption } from "@/features/products/types"
import ProductCard from "@/features/products/ProductCard"
import FilterSidebar from "@/features/products/FilterSidebar"
import SortBar from "@/features/products/SortBar"
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

export default function ProductsPage() {
  const t = useTranslations("Offers")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState<SortOption>("default")
  const [pageSize, setPageSize] = useState<number>(12)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      // 1. Search Query Filter
      if (
        filters.searchQuery &&
        !product.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !product.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false
      }

      // 2. Price Range Filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // 3. Availability Filter
      const { inStock, outOfStock } = filters.availability
      if (inStock || outOfStock) {
        if (inStock && !product.isAvailable) return false
        if (outOfStock && product.isAvailable) return false
      }

      // 4. Category Filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
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
      // Default: maintain mock data order
      return 0
    })
  }, [filters, sortBy])

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, pageSize)
  }, [filteredProducts, pageSize])

  return (
    <div className="space-y-6">
      {/* Title Header Section (Simple and Elegant) */}
      <div className="space-y-1.5 py-2 text-start">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1B15] dark:text-neutral-100">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Main Grid: Filters + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-20">
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />
        </aside>

        {/* Right Side: Product Listing & Controls */}
        <section className="lg:col-span-3 space-y-6">
          {/* Mobile Filter toggle button & Search bar */}
          <div className="flex gap-3 lg:hidden">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#ECE6DB] bg-white rounded-xl text-xs font-semibold text-primary uppercase tracking-wider dark:bg-neutral-900 dark:border-neutral-800 dark:text-[#E68A49] transition-colors"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            <div className="flex-1 flex items-center gap-2 border border-[#ECE6DB] bg-white rounded-xl px-3 py-1 dark:bg-neutral-900 dark:border-neutral-800 transition-colors">
              <input
                type="text"
                placeholder="Search bakery..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full text-xs outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Desktop search block */}
          <div className="hidden lg:flex items-center gap-2 border border-[#ECE6DB] bg-white rounded-xl px-4 py-2 dark:bg-neutral-900 dark:border-neutral-800 transition-colors">
            <input
              type="text"
              placeholder="Search by bread title, description, pastries..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>

          {/* Mobile sliding-down Filter drawer */}
          {mobileFilterOpen && (
            <div className="lg:hidden p-1 bg-[#FAF7F2] rounded-[20px] dark:bg-neutral-950 animate-in fade-in duration-200">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                onClear={handleClearFilters}
              />
            </div>
          )}

          {/* Sorting & limit bar */}
          <SortBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalCount={filteredProducts.length}
          />

          {/* Products Grid */}
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#ECE6DB] rounded-[24px] bg-white dark:bg-neutral-900 dark:border-neutral-800 p-8 space-y-4">
              <div className="bg-[#FAF2ED] dark:bg-neutral-850 p-4 rounded-full text-primary dark:text-[#E68A49]">
                <Search size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                  No baked goodies found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  We couldn&apos;t find any products matching your current filters. Try resetting the price slider or category selections.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432] text-xs font-semibold px-4 py-2 rounded-full transition-all"
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
