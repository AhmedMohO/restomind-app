"use client"

import React from "react"
import { SortOption } from "../types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"

interface SortBarProps {
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  totalCount: number
}

export default function SortBar({
  sortBy,
  onSortChange,
  pageSize,
  onPageSizeChange,
  totalCount,
}: SortBarProps) {
  const t = useTranslations("Offers")

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "default":
        return t("sortDefault")
      case "price-asc":
        return t("sortPriceAsc")
      case "price-desc":
        return t("sortPriceDesc")
      case "rating-desc":
        return t("sortRatingDesc")
      default:
        return option
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECE6DB] pb-4 dark:border-neutral-800">
      {/* Product Count */}
      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {t("showingResults", {
          start: totalCount > 0 ? 1 : 0,
          end: Math.min(pageSize, totalCount),
          total: totalCount,
        })}
      </span>

      {/* Sorting selectors */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort By Selector */}
        <div className="flex items-center">
          <Label className="dark:bg-neutral-850 flex h-8 items-center rounded-s-md rounded-e-none border border-e-0 border-input bg-[#FAF7F2] px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t("sortBy")}
          </Label>
          <Select
            value={sortBy}
            onValueChange={(val) => onSortChange(val as SortOption)}
          >
            <SelectTrigger className="h-8 min-w-36 rounded-s-none rounded-e-md border border-input bg-white text-xs focus:ring-1 focus:ring-ring focus:outline-none dark:bg-neutral-900">
              <SelectValue>{getSortLabel(sortBy)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="border border-input bg-popover text-xs text-popover-foreground shadow-md">
              <SelectItem value="default">{t("sortDefault")}</SelectItem>
              <SelectItem value="price-asc">{t("sortPriceAsc")}</SelectItem>
              <SelectItem value="price-desc">{t("sortPriceDesc")}</SelectItem>
              <SelectItem value="rating-desc">{t("sortRatingDesc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center">
          <Label className="dark:bg-neutral-850 flex h-8 items-center rounded-s-md rounded-e-none border border-e-0 border-input bg-[#FAF7F2] px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t("show")}
          </Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-8 min-w-16 rounded-s-none rounded-e-md border border-input bg-white text-xs focus:ring-1 focus:ring-ring focus:outline-none dark:bg-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border border-input bg-popover text-xs text-popover-foreground shadow-md">
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="36">36</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
