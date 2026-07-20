"use client"

import React from "react"
import { FilterState } from "../types"
import {
  Accordion,
  AccordionItem,
  AccordionTriggerPlus,
  AccordionContent,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { X, Loader2, Sparkles, Flame, Percent } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"
import { useCategories } from "@/features/categories/hooks"
import type { ApiCategory } from "@/features/categories/api/type"

interface FilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClear: () => void
}

const DEFAULT_TAGS = [
  "Daily Fresh",
  "Bestseller",
  "Stone-baked",
  "Sourdough",
  "Artisanal",
  "Traditional",
  "Discounted",
  "Whole Wheat",
  "Italian",
  "French",
  "Savory",
  "Sweet",
  "Pistachio",
  "Chocolate",
]

const DISCOUNT_OPTIONS = [0, 15, 25, 40]

export default function FilterSidebar({
  filters,
  onFiltersChange,
  onClear,
}: FilterSidebarProps) {
  const t = useTranslations("Offers")
  const locale = useLocale()
  const dir = locale === "ar" ? "rtl" : "ltr"

  const { data: apiCategories, isLoading: isCategoriesLoading } = useCategories()

  const handlePriceChange = (val: number | readonly number[]) => {
    if (Array.isArray(val)) {
      onFiltersChange({
        ...filters,
        priceRange: [val[0], val[1]] as [number, number],
      })
    }
  }

  const handleMinPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    onFiltersChange({
      ...filters,
      priceRange: [val, filters.priceRange[1]],
    })
  }

  const handleMaxPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    onFiltersChange({
      ...filters,
      priceRange: [filters.priceRange[0], val],
    })
  }

  const handleCategoryToggle = (category: ApiCategory) => {
    const isSelected =
      filters.categories.includes(category._id) ||
      filters.categories.includes(category.name)

    const newCategories = isSelected
      ? filters.categories.filter(
          (c) => c !== category._id && c !== category.name
        )
      : [...filters.categories, category._id]

    onFiltersChange({
      ...filters,
      categories: newCategories,
    })
  }

  const handleTagToggle = (tag: string) => {
    const isSelected = filters.tags?.includes(tag)
    const newTags = isSelected
      ? (filters.tags || []).filter((t) => t !== tag)
      : [...(filters.tags || []), tag]

    onFiltersChange({
      ...filters,
      tags: newTags,
    })
  }

  const handleBestsellerToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      isBestseller: checked,
    })
  }

  const handleFeaturedToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      featuredOnly: checked,
    })
  }

  const handleMinDiscountSelect = (discount: number) => {
    onFiltersChange({
      ...filters,
      minDiscount: discount === filters.minDiscount ? 0 : discount,
    })
  }

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
    <div
      dir={dir}
      className="w-full space-y-6 rounded-[20px] border border-[#ECE6DB] bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-dashed border-[#ECE6DB] pb-3 dark:border-neutral-800">
        <div className="relative">
          <h2 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
            {t("filterTitle")}
          </h2>
          <div className="absolute -bottom-[13px] start-0 h-0.5 w-12 bg-[#7C4A27] dark:bg-[#C2733C]" />
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-[#7C4A27] uppercase transition-colors hover:bg-[#F2ECE1] dark:bg-neutral-800 dark:text-[#E68A49] dark:hover:bg-neutral-700"
        >
          <X size={12} />
          <span>{t("clear")}</span>
        </button>
      </div>

      {/* Accordions */}
      <Accordion
        multiple
        defaultValue={["price", "categories", "badges", "tags"]}
        className="space-y-4"
      >
        {/* PRICE ACCORDION */}
        <AccordionItem value="price" className="border-none">
          <AccordionTriggerPlus className="pb-2">{t("price")}</AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-4 px-1">
              <Slider
                min={0}
                max={500}
                step={5}
                value={[filters.priceRange[0], filters.priceRange[1]]}
                onValueChange={handlePriceChange}
                className="py-3"
              />
              <div className="flex items-center gap-2 text-xs">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={handleMinPriceInput}
                    className="w-full pe-8 text-center"
                    min={0}
                    max={500}
                  />
                  <span className="pointer-events-none absolute top-1/2 end-2.5 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground uppercase">
                    {t("egp")}
                  </span>
                </div>
                <span className="text-muted-foreground">—</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={handleMaxPriceInput}
                    className="w-full pe-8 text-center"
                    min={0}
                    max={500}
                  />
                  <span className="pointer-events-none absolute top-1/2 end-2.5 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground uppercase">
                    {t("egp")}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* DYNAMIC CATEGORIES ACCORDION */}
        <AccordionItem value="categories" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("categories")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            {isCategoriesLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin text-[#7C4A27] dark:text-[#C2733C]" />
                <span>Loading categories...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(apiCategories ?? []).map((cat) => {
                  const isSelected =
                    filters.categories.includes(cat._id) ||
                    filters.categories.includes(cat.name)
                  return (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryToggle(cat)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        isSelected
                          ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                          : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                      )}
                    >
                      {getCategoryLabel(cat.name)}
                    </button>
                  )
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* OFFER BADGES & HIGHLIGHTS ACCORDION */}
        <AccordionItem value="badges" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            Offer Highlights
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bestseller"
                  checked={!!filters.isBestseller}
                  onCheckedChange={(checked) =>
                    handleBestsellerToggle(!!checked)
                  }
                />
                <Label
                  htmlFor="bestseller"
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                  <Flame size={13} className="text-amber-500" />
                  <span>Bestsellers Only</span>
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={!!filters.featuredOnly}
                  onCheckedChange={(checked) =>
                    handleFeaturedToggle(!!checked)
                  }
                />
                <Label
                  htmlFor="featured"
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                  <Sparkles size={13} className="text-purple-500" />
                  <span>Featured Offers Only</span>
                </Label>
              </div>

              {/* MINIMUM DISCOUNT SELECTOR */}
              <div className="space-y-1.5 pt-1">
                <p className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <Percent size={12} />
                  <span>Minimum Discount</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DISCOUNT_OPTIONS.map((disc) => {
                    const isSelected = (filters.minDiscount ?? 0) === disc
                    return (
                      <button
                        key={disc}
                        onClick={() => handleMinDiscountSelect(disc)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          isSelected
                            ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                            : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        )}
                      >
                        {disc === 0 ? "All" : `${disc}%+ Off`}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* DYNAMIC TAGS ACCORDION */}
        <AccordionItem value="tags" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            Tags
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_TAGS.map((tag) => {
                const isSelected = filters.tags?.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                      isSelected
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
      </Accordion>
    </div>
  )
}
