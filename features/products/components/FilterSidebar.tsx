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

  return (
    <div className="w-full space-y-6 rounded-[20px] border border-[#ECE6DB] bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-dashed border-[#ECE6DB] pb-3 dark:border-neutral-800">
        <div className="relative">
          <h2 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
            Filter
          </h2>
          <div className="absolute -bottom-[13px] left-0 h-0.5 w-12 bg-[#7C4A27] dark:bg-[#C2733C]" />
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-semibold tracking-wider text-[#7C4A27] uppercase transition-colors hover:bg-[#F2ECE1] dark:bg-neutral-800 dark:text-[#E68A49] dark:hover:bg-neutral-700"
        >
          <X size={12} />
          <span>Clear</span>
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
          <AccordionTriggerPlus className="pb-2">Price</AccordionTriggerPlus>
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
                    className="w-full pr-8 text-center"
                    min={0}
                    max={250}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground uppercase">
                    EGP
                  </span>
                </div>
                <span className="text-muted-foreground">—</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={handleMaxPriceInput}
                    className="w-full pr-8 text-center"
                    min={0}
                    max={250}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground uppercase">
                    EGP
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* AVAILABILITY ACCORDION */}
        <AccordionItem value="availability" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            Availability
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
                  In Stock
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
                  Out of Stock
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* BRANDS / CATEGORIES ACCORDION */}
        <AccordionItem value="categories" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            Categories
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
                    {category}
                  </button>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* MOCK ACCORDIONS TO MATCH SCREENSHOT SHAPE */}
        <AccordionItem value="bakery-style" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            Baking Style
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-1 pl-1 text-xs text-muted-foreground">
              <p>• Stone Baked</p>
              <p>• Clay Oven</p>
              <p>• Griddle Pan</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sweetness" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            Sweetness
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-1 pl-1 text-xs text-muted-foreground">
              <p>• Unsweetened</p>
              <p>• Mildly Sweet</p>
              <p>• Rich Dessert</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="allergens" className="border-none">
          <AccordionTriggerPlus className="pb-2">
            Allergen Free
          </AccordionTriggerPlus>
          <AccordionContent className="pt-2">
            <div className="space-y-1 pl-1 text-xs text-muted-foreground">
              <p>• Dairy Free</p>
              <p>• Gluten Free</p>
              <p>• Nut Free</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
