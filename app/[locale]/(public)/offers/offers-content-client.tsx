"use client"

import React, { useCallback, useEffect, useReducer, useState } from "react"
import type { ApiProduct } from "@/features/products/api/type"
import { fetchProductsAction } from "@/features/products/actions"
import type { GetProductsParams } from "@/features/products/api/type"
import type { PaginatedProducts } from "@/features/products/api/type"
import { FilterState, SortOption } from "@/features/products/types"
import ProductCard from "@/features/products/components/ProductCard"
import FilterSidebar from "@/features/products/components/FilterSidebar"
import SortBar from "@/features/products/components/SortBar"
import { Pagination } from "@/components/ui/pagination"
import { usePagination, type PaginationState } from "@/hooks/use-pagination"
import { Filter, Search, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface OffersContentClientProps {
  initialPage?: PaginatedProducts
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  priceRange: [0, 500],
  availability: { inStock: false, outOfStock: false },
  categories: [],
  tags: [],
}

type PaginationAction =
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_LIMIT"; limit: number }
  | { type: "SET_RESULT"; result: PaginatedProducts }

function paginationReducer(
  state: PaginationState,
  action: PaginationAction
): PaginationState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.page }
    case "SET_LIMIT":
      return { ...state, limit: action.limit, page: 1 }
    case "SET_RESULT":
      return {
        page: action.result.page,
        limit: action.result.limit,
        total: action.result.total,
        totalPages: action.result.totalPages,
      }
  }
}

export default function OffersContentClient({ initialPage }: OffersContentClientProps) {
  const t = useTranslations("Offers")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState<SortOption>("default")
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [products, setProducts] = useState<ApiProduct[]>(initialPage?.items ?? [])
  const [loading, setLoading] = useState(false)

  const [pState, dispatch] = useReducer(paginationReducer, {
    page: initialPage?.page ?? 1,
    limit: initialPage?.limit ?? 12,
    total: initialPage?.total ?? 0,
    totalPages: initialPage?.totalPages ?? 0,
  })

  const pag = usePagination(pState, (update) => {
    for (const [k, v] of Object.entries(update)) {
      if (k === "page") dispatch({ type: "SET_PAGE", page: v as number })
      if (k === "limit") dispatch({ type: "SET_LIMIT", limit: v as number })
    }
  })

  const fetchPage = useCallback(
    async (params: GetProductsParams) => {
      setLoading(true)
      try {
        const res = await fetchProductsAction(params)
        if (res) {
          setProducts(res.items)
          dispatch({ type: "SET_RESULT", result: res })
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!initialPage) {
      fetchPage({ page: 1, limit: 12 })
    }
  }, [])

  useEffect(() => {
    const params: GetProductsParams = {
      page: pag.page,
      limit: pag.limit,
    }
    if (sortBy !== "default") {
      const [sort, order] = sortBy.split("-") as [string, "asc" | "desc"]
      params.sort = sort
      params.order = order
    }
    if (filters.searchQuery) params.search = filters.searchQuery
    if (filters.categories.length === 1) params.category = filters.categories[0]

    fetchPage(params)
  }, [pag.page, pag.limit, sortBy, filters.searchQuery, filters.categories])

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    pag.resetPage()
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
              <span>{t("filters")}</span>
            </button>
            <div className="relative flex flex-1 items-center rounded-xl border border-[#ECE6DB] bg-white px-3 py-1 transition-colors dark:border-neutral-800 dark:bg-neutral-900">
              <Search size={16} className="me-2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchPlaceholderShort")}
                value={filters.searchQuery}
                onChange={(e) => {
                  setFilters({ ...filters, searchQuery: e.target.value })
                  pag.resetPage()
                }}
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
              onChange={(e) => {
                setFilters({ ...filters, searchQuery: e.target.value })
                pag.resetPage()
              }}
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
            onSortChange={(val) => {
              setSortBy(val)
              pag.resetPage()
            }}
            pageSize={pag.limit}
            onPageSizeChange={pag.setLimit}
            totalCount={pag.total}
          />

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <Pagination
                page={pag.page}
                totalPages={pag.totalPages}
                onPageChange={pag.setPage}
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
