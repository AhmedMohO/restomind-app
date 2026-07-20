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
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ALL_CATEGORIES } from "../data"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"

interface FilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClear: () => void
}

export default function FilterSidebar({
  filters,
  onFiltersChange,
  onClear,
}: FilterSidebarProps) {
  const t = useTranslations("Offers")
  const locale = useLocale()
  const dir = locale === "ar" ? "rtl" : "ltr"

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

  const handleAvailabilityChange = (
    type: "inStock" | "outOfStock",
    checked: boolean
  ) => {
    onFiltersChange({
      ...filters,
      availability: {
        ...filters.availability,
        [type]: checked,
      },
    })
  }

  const handleCategoryToggle = (category: string) => {
    const isSelected = filters.categories.includes(category)
    const newCategories = isSelected
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]

    onFiltersChange({
      ...filters,
      categories: newCategories,
    })
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "Bread":
        return t("categoryBread")
      case "Pastry":
        return t("categoryPastry")
      case "Cookies":
        return t("categoryCookies")
      case "Desserts":
        return t("categoryDesserts")
      default:
        return cat
    }
  }

  return (
    <div dir={dir} className="w-full space-y-6 rounded-[20px] border border-[#ECE6DB] bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
        defaultValue={["price", "availability", "categories"]}
        className="space-y-4"
      >
        {/* PRICE ACCORDION */}
        <AccordionItem value="price" className="border-none">
          <AccordionTriggerPlus className="pb-2">{t("price")}</AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-4 px-1">
              <Slider
                min={0}
                max={250}
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
                    max={250}
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
                    max={250}
                  />
                  <span className="pointer-events-none absolute top-1/2 end-2.5 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground uppercase">
                    {t("egp")}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* AVAILABILITY ACCORDION */}
        <AccordionItem value="availability" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("availability")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="inStock"
                  checked={filters.availability.inStock}
                  onCheckedChange={(checked) =>
                    handleAvailabilityChange("inStock", !!checked)
                  }
                />
                <Label
                  htmlFor="inStock"
                  className="cursor-pointer text-xs font-normal tracking-normal text-muted-foreground normal-case hover:text-foreground"
                >
                  {t("inStock")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="outOfStock"
                  checked={filters.availability.outOfStock}
                  onCheckedChange={(checked) =>
                    handleAvailabilityChange("outOfStock", !!checked)
                  }
                />
                <Label
                  htmlFor="outOfStock"
                  className="cursor-pointer text-xs font-normal tracking-normal text-muted-foreground normal-case hover:text-foreground"
                >
                  {t("outOfStock")}
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CATEGORIES ACCORDION */}
        <AccordionItem value="categories" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("categories")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((category) => {
                const isSelected = filters.categories.includes(category)
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-[#7C4A27] bg-[#7C4A27] text-white dark:border-[#C2733C] dark:bg-[#C2733C]"
                        : "border-[#ECE6DB] bg-white text-muted-foreground hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    )}
                  >
                    {getCategoryLabel(category)}
                  </button>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ADDITIONAL ACCORDIONS */}
        <AccordionItem value="bakery-style" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("bakingStyle")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-1 ps-1 text-xs text-muted-foreground">
              <p>• {t("stoneBaked")}</p>
              <p>• {t("clayOven")}</p>
              <p>• {t("griddlePan")}</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sweetness" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("sweetness")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-1 ps-1 text-xs text-muted-foreground">
              <p>• {t("unsweetened")}</p>
              <p>• {t("mildlySweet")}</p>
              <p>• {t("richDessert")}</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="allergens" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            {t("allergens")}
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-1 ps-1 text-xs text-muted-foreground">
              <p>• {t("dairyFree")}</p>
              <p>• {t("glutenFree")}</p>
              <p>• {t("nutFree")}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
