"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { useSearchParams } from "next/navigation"
import { useRouter, usePathname, Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import {
  Search,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Store,
  MapPin,
  X,
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { GetActiveOffersParams } from "@/features/offers/api/type"
import { useRestaurantsList } from "@/features/restaurant/hooks/use-restaurant"
import { useActiveOffersList } from "@/features/offers/hooks/use-offers"
import type { OffersContentClientProps } from "@/features/offers/types"
import { getPageNumbers } from "@/features/offers/utils"
import { RestaurantCard } from "@/features/offers/components/restaurant-card"
import Image from "next/image"

const SHOPS_PER_PAGE = 12
const OFFERS_PER_PAGE = 12

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

  // --- Shops tab: debounced search + server-side pagination ---
  const shopSearchParam = searchParams.get("shopSearch") || ""
  const shopPage = Math.max(1, Number(searchParams.get("shopPage")) || 1)
  const [shopSearchInput, setShopSearchInput] = useState(shopSearchParam)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local input when URL param changes externally (e.g. browser back)
  useEffect(() => {
    setShopSearchInput(shopSearchParam)
  }, [shopSearchParam])

  const handleShopSearchChange = useCallback(
    (value: string) => {
      setShopSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString())
          if (value.trim()) {
            params.set("shopSearch", value.trim())
          } else {
            params.delete("shopSearch")
          }
          params.delete("shopPage") // reset to page 1 on new search
          const qs = params.toString()
          router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
        })
      }, 400)
    },
    [searchParams, pathname, router, startTransition]
  )

  // TanStack Query for paginated restaurants (shops tab)
  const { data: restaurantsData, isLoading: isShopsLoading } =
    useRestaurantsList(
      {
        page: shopPage,
        limit: SHOPS_PER_PAGE,
        search: shopSearchParam || undefined,
      },
      {
        initialData:
          shopPage === 1 && !shopSearchParam && allRestaurants.length
            ? {
                items: allRestaurants.slice(0, SHOPS_PER_PAGE),
                page: 1,
                limit: SHOPS_PER_PAGE,
                total: allRestaurants.length,
                totalPages: Math.ceil(allRestaurants.length / SHOPS_PER_PAGE),
              }
            : undefined,
      }
    )

  const paginatedShops = restaurantsData?.items ?? []
  const shopsTotalPages = restaurantsData?.totalPages ?? 1
  const shopsTotalCount = restaurantsData?.total ?? allRestaurants.length
  const shopPageNumbers = getPageNumbers(shopPage, shopsTotalPages)

  // Active Tab: "items" (products) vs "shops" (restaurants)
  const activeTab = useMemo(() => {
    return searchParams.get("tab") === "shops" ? "shops" : "items"
  }, [searchParams])

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

  // Count offers per restaurant ID for badge rendering
  const offersCountMap = useMemo(() => {
    const countsMap = new Map<string, number>()
    for (const offer of initialOffers) {
      const rest = offer.restaurantId
      const id = typeof rest === "object" ? rest?._id : rest
      if (id) {
        countsMap.set(id, (countsMap.get(id) || 0) + 1)
      }
    }
    return countsMap
  }, [initialOffers])

  // Shop pagination URL builders
  const buildShopUrlWithPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) {
      params.delete("shopPage")
    } else {
      params.set("shopPage", String(p))
    }
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ""}`
  }

  const handleShopPageChange = (p: number) => {
    startTransition(() => {
      router.push(buildShopUrlWithPage(p), { scroll: true })
    })
  }

  // --- Server-side filtered/sorted/paginated offers via TanStack Query ---
  const sortMapping: Record<
    string,
    { sortBy: GetActiveOffersParams["sortBy"]; sortOrder: "asc" | "desc" }
  > = {
    "price-asc": { sortBy: "offerPrice", sortOrder: "asc" },
    "price-desc": { sortBy: "offerPrice", sortOrder: "desc" },
    "rating-desc": { sortBy: "discountPercentage", sortOrder: "desc" },
  }
  const serverSort = sortMapping[filterState.sort]

  const offersQueryParams = useMemo(
    () => ({
      page: filterState.page,
      limit: filterState.limit,
      ...(filterState.q ? { search: filterState.q } : {}),
      ...(filterState.categories.length === 1
        ? { categoryId: filterState.categories[0] }
        : {}),
      ...(filterState.restaurants.length === 1
        ? { restaurantId: filterState.restaurants[0] }
        : {}),
      ...(filterState.featuredOnly ? { featured: true } : {}),
      ...(filterState.minPrice > 0 ? { minPrice: filterState.minPrice } : {}),
      ...(filterState.maxPrice < 500 ? { maxPrice: filterState.maxPrice } : {}),
      ...(serverSort
        ? { sortBy: serverSort.sortBy, sortOrder: serverSort.sortOrder }
        : {}),
    }),
    [filterState, serverSort]
  )

  const { data: offersData, isLoading: isOffersLoading } = useActiveOffersList(
    offersQueryParams,
    {
      initialData:
        !filterState.q &&
        filterState.page === 1 &&
        filterState.categories.length === 0 &&
        filterState.restaurants.length === 0 &&
        !filterState.featuredOnly &&
        filterState.minPrice === 0 &&
        filterState.maxPrice >= 500 &&
        !serverSort
          ? {
              items: initialOffers.slice(0, filterState.limit),
              page: 1,
              limit: filterState.limit,
              total: initialOffers.length,
              totalPages: Math.ceil(initialOffers.length / filterState.limit),
            }
          : undefined,
    }
  )

  const displayedOffers = offersData?.items ?? []
  const totalPages = offersData?.totalPages ?? 1
  const offersTotalCount = offersData?.total ?? initialOffers.length
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

  const handleTabChange = (newTab: "items" | "shops") => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (newTab === "shops") {
        params.set("tab", "shops")
      } else {
        params.delete("tab")
      }
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`)
    })
  }

  const handleSelectRestaurant = (restaurantId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("tab") // Switch back to items view
      params.set("restaurants", restaurantId)
      params.set("page", "1")
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`)
    })
  }

  const handleClearRestaurantFilter = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("restaurants")
      params.set("page", "1")
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`)
    })
  }

  // Currently selected restaurant object for filter banner
  const selectedRestaurantObj = useMemo(() => {
    if (filterState.restaurants.length === 0) return null
    const id = filterState.restaurants[0]
    return allRestaurants.find((r) => r._id === id || r.name === id)
  }, [filterState.restaurants, allRestaurants])

  return (
    <div className="container mx-auto space-y-6">
      {/* Top Header Bar & Theme Tab Switcher */}
      <div className="flex flex-col gap-4 border-b border-[#ECE6DB] pb-5 md:flex-row md:items-center md:justify-between dark:border-neutral-800">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#2B1B15] sm:text-3xl dark:text-neutral-100">
            {activeTab === "shops" ? t("allShopsTitle") : t("title")}
          </h1>
          <p className="text-xs font-medium text-muted-foreground">
            {activeTab === "shops"
              ? t("shopsFound", { count: shopsTotalCount })
              : t("subtitle")}
          </p>
        </div>

        {/* Tab Toggle Control (RestoMind Theme) */}
        <div className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-[#ECE6DB] bg-[#FAF7F2] p-1.5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/80">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleTabChange("items")}
            className={cn(
              "flex h-auto cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 disabled:opacity-80",
              activeTab === "items"
                ? "border border-[#ECE6DB]/80 bg-white text-[#7C4A27] shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-[#E68A49]"
                : "text-muted-foreground hover:bg-white/50 hover:text-foreground dark:hover:bg-neutral-800/40"
            )}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>{t("tabItems")}</span>
            <Badge
              variant="secondary"
              className="ml-0.5 rounded-full border-none bg-[#FAF2ED] px-2 py-0.5 text-[10px] font-bold text-[#7C4A27] dark:bg-neutral-800/80 dark:text-[#E68A49]"
            >
              {offersTotalCount}
            </Badge>
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleTabChange("shops")}
            className={cn(
              "flex h-auto cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 disabled:opacity-80",
              activeTab === "shops"
                ? "border border-[#ECE6DB]/80 bg-white text-[#7C4A27] shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-[#E68A49]"
                : "text-muted-foreground hover:bg-white/50 hover:text-foreground dark:hover:bg-neutral-800/40"
            )}
          >
            <Store className="h-3.5 w-3.5" />
            <span>{t("tabShops")}</span>
            <Badge
              variant="secondary"
              className="ml-0.5 rounded-full border-none bg-[#FAF2ED] px-2 py-0.5 text-[10px] font-bold text-[#7C4A27] dark:bg-neutral-800/80 dark:text-[#E68A49]"
            >
              {allRestaurants.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Main Content View Container with Smooth Loading Indicator */}
      <div className="relative min-h-[400px]">
        {/* Visible Transition Loading Overlay on tab switch & filter updates */}
        {isPending && (
          <div className="absolute inset-0 z-20 flex items-start justify-center rounded-3xl bg-white/50 pt-20 backdrop-blur-[1px] transition-all duration-300 dark:bg-neutral-950/50">
            <div className="flex items-center gap-3 rounded-2xl border border-[#ECE6DB] bg-white px-5 py-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <Loader2 className="h-5 w-5 animate-spin text-[#7C4A27] dark:text-[#E68A49]" />
              <span className="text-xs font-semibold text-foreground">
                {t("updating")}
              </span>
            </div>
          </div>
        )}

        {activeTab === "shops" ? (
          <section className="space-y-6">
            {/* Shop Search Subheader */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3.5 rtl:left-auto" />
                <Input
                  type="text"
                  value={shopSearchInput}
                  onChange={(e) => handleShopSearchChange(e.target.value)}
                  placeholder={t("searchShopsPlaceholder")}
                  className="h-11 w-full rounded-2xl border border-[#ECE6DB] bg-white pr-4 pl-10 text-xs font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none rtl:pr-10 rtl:pl-4 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </div>
            </div>

            {/* Restaurant Cards Grid */}
            {isShopsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#7C4A27] dark:text-[#E68A49]" />
              </div>
            ) : paginatedShops.length > 0 ? (
              <>
                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 transition-opacity duration-200 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                    isPending && "opacity-50"
                  )}
                >
                  {paginatedShops.map((shop) => (
                    <RestaurantCard
                      key={shop._id}
                      restaurant={shop}
                      offersCount={offersCountMap.get(shop._id) || 0}
                      onSelect={handleSelectRestaurant}
                    />
                  ))}
                </div>

                {/* Shops Pagination Controls */}
                {shopsTotalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-[#ECE6DB] pt-8 dark:border-neutral-800">
                    <Link
                      href={buildShopUrlWithPage(shopPage - 1)}
                      onClick={(e) => {
                        e.preventDefault()
                        if (shopPage > 1) handleShopPageChange(shopPage - 1)
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECE6DB] bg-white text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900",
                        shopPage === 1 && "pointer-events-none opacity-30"
                      )}
                    >
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    </Link>

                    {shopPageNumbers.map((p, idx) =>
                      p === "..." ? (
                        <span
                          key={`shop-dots-${idx}`}
                          className="flex h-9 w-9 items-center justify-center text-xs text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Link
                          key={`shop-page-${p}`}
                          href={buildShopUrlWithPage(p as number)}
                          onClick={(e) => {
                            e.preventDefault()
                            handleShopPageChange(p as number)
                          }}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-colors",
                            p === shopPage
                              ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                              : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900"
                          )}
                        >
                          {p}
                        </Link>
                      )
                    )}

                    <Link
                      href={buildShopUrlWithPage(shopPage + 1)}
                      onClick={(e) => {
                        e.preventDefault()
                        if (shopPage < shopsTotalPages)
                          handleShopPageChange(shopPage + 1)
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECE6DB] bg-white text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900",
                        shopPage === shopsTotalPages &&
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
                  <Store size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                    {t("noShopsFound")}
                  </h3>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {t("noShopsDesc")}
                  </p>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* Items View */
          <div className="space-y-6">
            {/* Top Mobile Filter Trigger */}
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
                    availableCategories={allCategories}
                    availableRestaurants={allRestaurants}
                    startTransition={startTransition}
                  />
                </SheetContent>
              </Sheet>
            </div>

            {/* Selected Restaurant Filter Banner */}
            {selectedRestaurantObj && (
              <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center dark:bg-primary/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                      {t("selectedRestaurant")}
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#2B1B15] dark:text-neutral-100">
                      {selectedRestaurantObj.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTabChange("shops")}
                    className="cursor-pointer gap-1.5 rounded-xl border-[#ECE6DB] bg-white text-xs hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <Store className="h-3.5 w-3.5 text-primary" />
                    <span>{t("viewAllShops")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearRestaurantFilter}
                    className="cursor-pointer gap-1 rounded-xl text-xs text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                    <span>{t("clear")}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 2-Column Sidebar & Grid Layout */}
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
              {/* Desktop Left Sidebar */}
              <aside className="sticky top-4 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:col-span-1 lg:block">
                <ProductFilterSidebar
                  availableCategories={allCategories}
                  availableRestaurants={allRestaurants}
                  startTransition={startTransition}
                />
              </aside>

              {/* Right Content Area */}
              <section className="min-w-0 space-y-6 lg:col-span-3">
                <ProductsFilterBar startTransition={startTransition} />

                <ActiveFilters
                  availableCategories={allCategories}
                  availableRestaurants={allRestaurants}
                />

                <div className="relative">
                  {isOffersLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-[#7C4A27] dark:text-[#E68A49]" />
                    </div>
                  ) : displayedOffers.length > 0 ? (
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
        )}
      </div>
    </div>
  )
}
