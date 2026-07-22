"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { X, SlidersHorizontal, RotateCcw } from "lucide-react"
import {
  Accordion,
  AccordionItem,
  AccordionTriggerPlus,
  AccordionContent,
} from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ApiCategory } from "@/features/categories/api/type"

export interface ApiRestaurantFilter {
  _id: string
  name: string
}

interface ProductFilterSidebarProps {
  availableCategories: ApiCategory[]
  availableTags: string[]
  availableRestaurants?: ApiRestaurantFilter[]
  minPriceLimit?: number
  maxPriceLimit?: number
  startTransition?: React.TransitionStartFunction
}

const DISCOUNT_OPTIONS = [0, 15, 25, 40]

export function ProductFilterSidebar({
  availableCategories,
  availableTags,
  availableRestaurants = [],
  minPriceLimit = 0,
  maxPriceLimit = 500,
  startTransition,
}: ProductFilterSidebarProps) {
  const t = useTranslations("Offers")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Active filter params from URL
  const activeCategories =
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  const activeRestaurants =
    searchParams.get("restaurants")?.split(",").filter(Boolean) || []
  const activeTags = searchParams.get("tags")?.split(",").filter(Boolean) || []
  const isBestseller = searchParams.get("bestseller") === "true"
  const featuredOnly = searchParams.get("featured") === "true"
  const minDiscountParam = Number(searchParams.get("minDiscount")) || 0

  // Local price inputs (avoids lag/crashing when dragging slider or typing)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("minPrice")) || minPriceLimit,
    Number(searchParams.get("maxPrice")) || maxPriceLimit,
  ])

  // Sync local price range if URL params change externally (e.g. navigation / reset)
  const committedMinPrice = searchParams.get("minPrice")
  const committedMaxPrice = searchParams.get("maxPrice")
  const [prevCommitted, setPrevCommitted] = useState({
    minPrice: committedMinPrice,
    maxPrice: committedMaxPrice,
  })

  if (
    committedMinPrice !== prevCommitted.minPrice ||
    committedMaxPrice !== prevCommitted.maxPrice
  ) {
    setPrevCommitted({
      minPrice: committedMinPrice,
      maxPrice: committedMaxPrice,
    })
    setPriceRange([
      committedMinPrice ? Number(committedMinPrice) : minPriceLimit,
      committedMaxPrice ? Number(committedMaxPrice) : maxPriceLimit,
    ])
  }

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    // Always reset page on filter change
    params.delete("page")

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }

    const transition = startTransition || ((cb: () => void) => cb())
    transition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handlePriceApply = () => {
    updateUrl({
      minPrice:
        priceRange[0] === minPriceLimit ? null : priceRange[0].toString(),
      maxPrice:
        priceRange[1] === maxPriceLimit ? null : priceRange[1].toString(),
    })
  }

  const handleCategoryToggle = (catId: string, checked: boolean) => {
    const newCategories = checked
      ? [...activeCategories.filter((c) => c !== catId), catId]
      : activeCategories.filter((c) => c !== catId)

    updateUrl({
      categories: newCategories.length > 0 ? newCategories.join(",") : null,
    })
  }

  const handleRestaurantToggle = (restId: string, checked: boolean) => {
    const newRestaurants = checked
      ? [...activeRestaurants.filter((r) => r !== restId), restId]
      : activeRestaurants.filter((r) => r !== restId)

    updateUrl({
      restaurants: newRestaurants.length > 0 ? newRestaurants.join(",") : null,
    })
  }

  const handleTagToggle = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...activeTags.filter((t) => t !== tag), tag]
      : activeTags.filter((t) => t !== tag)

    updateUrl({
      tags: newTags.length > 0 ? newTags.join(",") : null,
    })
  }

  const handleReset = () => {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    const sort = searchParams.get("sort")
    const limit = searchParams.get("limit")
    if (q) params.set("q", q)
    if (sort) params.set("sort", sort)
    if (limit) params.set("limit", limit)

    const transition = startTransition || ((cb: () => void) => cb())
    transition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const hasActiveFilters =
    activeCategories.length > 0 ||
    activeRestaurants.length > 0 ||
    activeTags.length > 0 ||
    isBestseller ||
    featuredOnly ||
    minDiscountParam > 0 ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice")

  const getCategoryLabel = (catName: string) => {
    switch (catName) {
      case "Bread":
        return t("categoryBread")
      case "Pastry":
        return t("categoryPastry")
      case "Cookies":
        return t("categoryCookies")
      case "Desserts":
        return t("categoryDesserts")
      default:
        return catName
    }
  }

  return (
    <div className="w-full space-y-6 border border-[#ECE6DB] bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-dashed border-[#ECE6DB] pb-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
            {t("filterTitle")}
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-semibold tracking-wider text-rose-600 uppercase hover:underline dark:text-rose-400"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{t("clear")}</span>
          </button>
        )}
      </div>

      <Accordion
        multiple
        defaultValue={["categories", "restaurants", "price", "badges", "tags"]}
        className="space-y-4"
      >
        {/* PRICE RANGE SECTION */}
        <AccordionItem value="price" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("price")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-4 px-1">
              <Slider
                min={minPriceLimit}
                max={maxPriceLimit}
                step={5}
                value={priceRange}
                onValueChange={(val) => setPriceRange(val as [number, number])}
                className="py-3"
              />
              <div className="flex items-center gap-2 text-xs">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([
                        Math.max(minPriceLimit, Number(e.target.value)),
                        priceRange[1],
                      ])
                    }
                    className="w-full pe-8 text-center"
                    min={minPriceLimit}
                    max={maxPriceLimit}
                  />
                  <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground uppercase">
                    {t("egp")}
                  </span>
                </div>
                <span className="text-muted-foreground">—</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([
                        priceRange[0],
                        Math.min(maxPriceLimit, Number(e.target.value)),
                      ])
                    }
                    className="w-full pe-8 text-center"
                    min={minPriceLimit}
                    max={maxPriceLimit}
                  />
                  <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground uppercase">
                    {t("egp")}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handlePriceApply}
                className="h-8 w-full rounded-xl bg-primary text-xs font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {t("applyPriceFilter")}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CATEGORIES SECTION (Checkboxes) */}
        {availableCategories.length > 0 && (
          <AccordionItem value="categories" className="border-none">
            <AccordionTriggerPlus className="pb-2">
              {t("categories")}
            </AccordionTriggerPlus>
            <AccordionContent className="max-h-[220px] overflow-y-auto pe-1 pt-2">
              <div className="space-y-2.5">
                {availableCategories.map((cat) => {
                  const isChecked =
                    activeCategories.includes(cat._id) ||
                    activeCategories.includes(cat.name)
                  return (
                    <div key={cat._id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${cat._id}`}
                        checked={isChecked}
                        onCheckedChange={(c) =>
                          handleCategoryToggle(cat._id, !!c)
                        }
                      />
                      <Label
                        htmlFor={`cat-${cat._id}`}
                        className="flex cursor-pointer items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                      >
                        {getCategoryLabel(cat.name)}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* RESTAURANTS SECTION (Checkboxes) */}
        {availableRestaurants.length > 0 && (
          <AccordionItem value="restaurants" className="border-none">
            <AccordionTriggerPlus className="pb-2">
              {t("restaurants")}
            </AccordionTriggerPlus>
            <AccordionContent className="max-h-[220px] overflow-y-auto pe-1 pt-2">
              <div className="space-y-2.5">
                {availableRestaurants.map((rest) => {
                  const isChecked =
                    activeRestaurants.includes(rest._id) ||
                    activeRestaurants.includes(rest.name)
                  return (
                    <div key={rest._id} className="flex items-center gap-2">
                      <Checkbox
                        id={`rest-${rest._id}`}
                        checked={isChecked}
                        onCheckedChange={(c) =>
                          handleRestaurantToggle(rest._id, !!c)
                        }
                      />
                      <Label
                        htmlFor={`rest-${rest._id}`}
                        className="flex cursor-pointer items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                      >
                        {rest.name}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* OFFER HIGHLIGHTS SECTION */}
        <AccordionItem value="badges" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("offerHighlights")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bestseller"
                  checked={isBestseller}
                  onCheckedChange={(c) =>
                    updateUrl({ bestseller: c ? "true" : null })
                  }
                />
                <Label
                  htmlFor="bestseller"
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                  <span>{t("bestsellersOnly")}</span>
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={featuredOnly}
                  onCheckedChange={(c) =>
                    updateUrl({ featured: c ? "true" : null })
                  }
                />
                <Label
                  htmlFor="featured"
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                  <span>{t("featuredOffers")}</span>
                </Label>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="flex items-center gap-1">
                  <span className="font-semibold text-primary">
                    {t("minimumDiscount")}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DISCOUNT_OPTIONS.map((disc) => {
                    const isSelected = minDiscountParam === disc
                    return (
                      <button
                        key={disc}
                        onClick={() =>
                          updateUrl({
                            minDiscount:
                              isSelected || disc === 0 ? null : disc.toString(),
                          })
                        }
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          isSelected
                            ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                            : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        )}
                      >
                        {disc === 0 ? "All" : t("off", { percent: disc })}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* DYNAMIC TAGS SECTION (Only Available Tags from Offers) */}
        {availableTags.length > 0 && (
          <AccordionItem value="tags" className="border-none">
            <AccordionTriggerPlus className="pb-2">
              {t("tags")}
            </AccordionTriggerPlus>
            <AccordionContent className="pt-2">
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isChecked = activeTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag, !isChecked)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                        isChecked
                          ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                          : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                      )}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

// Removable Active Filter Chips Component (Chips above product grid)
export function ActiveFilters({
  availableCategories,
  availableRestaurants = [],
}: {
  availableCategories: ApiCategory[]
  availableRestaurants?: ApiRestaurantFilter[]
}) {
  const t = useTranslations("Offers")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeCategories =
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  const activeRestaurants =
    searchParams.get("restaurants")?.split(",").filter(Boolean) || []
  const activeTags = searchParams.get("tags")?.split(",").filter(Boolean) || []
  const isBestseller = searchParams.get("bestseller") === "true"
  const featuredOnly = searchParams.get("featured") === "true"
  const minDiscountParam = Number(searchParams.get("minDiscount")) || 0
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")

  const removeParamItem = (key: string, valueToRemove: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    const currentVal = params.get(key)
    if (currentVal) {
      const items = currentVal.split(",").filter((x) => x !== valueToRemove)
      if (items.length > 0) {
        params.set(key, items.join(","))
      } else {
        params.delete(key)
      }
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const removeSingleParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const removePriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    params.delete("minPrice")
    params.delete("maxPrice")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const hasChips =
    activeCategories.length > 0 ||
    activeRestaurants.length > 0 ||
    activeTags.length > 0 ||
    isBestseller ||
    featuredOnly ||
    minDiscountParam > 0 ||
    minPrice !== null ||
    maxPrice !== null

  if (!hasChips) return null

  const getCatName = (idOrName: string) => {
    const found = availableCategories.find(
      (c) => c._id === idOrName || c.name === idOrName
    )
    return found ? found.name : idOrName
  }

  const getRestName = (idOrName: string) => {
    const found = availableRestaurants.find(
      (r) => r._id === idOrName || r.name === idOrName
    )
    return found ? found.name : idOrName
  }

  return (
    <div className="flex animate-in flex-wrap items-center gap-1.5 pb-2 duration-200 zoom-in-95 fade-in">
      <span className="me-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("active")}
      </span>

      {/* Category Chips */}
      {activeCategories.map((c) => (
        <button
          key={c}
          onClick={() => removeParamItem("categories", c)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <span>{getCatName(c)}</span>
          <X className="h-3 w-3" />
        </button>
      ))}

      {/* Restaurant Chips */}
      {activeRestaurants.map((r) => (
        <button
          key={r}
          onClick={() => removeParamItem("restaurants", r)}
          className="inline-flex items-center gap-1 rounded-full border border-[#7C4A27]/30 bg-[#7C4A27]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7C4A27] transition-colors hover:bg-[#7C4A27]/20 dark:border-[#C2733C]/30 dark:bg-[#C2733C]/10 dark:text-[#C2733C]"
        >
          <span>{getRestName(r)}</span>
          <X className="h-3 w-3" />
        </button>
      ))}

      {/* Tag Chips */}
      {activeTags.map((t) => (
        <button
          key={t}
          onClick={() => removeParamItem("tags", t)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <span>{t}</span>
          <X className="h-3 w-3" />
        </button>
      ))}

      {/* Price Chip */}
      {(minPrice !== null || maxPrice !== null) && (
        <button
          onClick={removePriceFilter}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <span>
            {minPrice || 0} - {maxPrice || 500} {t("egp")}
          </span>
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Bestseller Chip */}
      {isBestseller && (
        <button
          onClick={() => removeSingleParam("bestseller")}
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
        >
          <span>{t("bestsellersOnly")}</span>
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Featured Chip */}
      {featuredOnly && (
        <button
          onClick={() => removeSingleParam("featured")}
          className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-500/20 dark:text-purple-400"
        >
          <span>{t("featuredOffers")}</span>
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Min Discount Chip */}
      {minDiscountParam > 0 && (
        <button
          onClick={() => removeSingleParam("minDiscount")}
          className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
        >
          <span>{t("off", { percent: minDiscountParam })}</span>
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
