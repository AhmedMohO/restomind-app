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
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECE6DB] pb-4 dark:border-neutral-800">
      {/* Product Count */}
      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Showing 1-{Math.min(pageSize, totalCount)} of {totalCount} results
      </span>

      {/* Sorting selectors */}
      <div className="flex items-center gap-3">
        {/* Sort By Selector */}
        <div className="flex items-center">
          <Label className="dark:bg-neutral-850 flex h-8 items-center rounded-l-md border border-r-0 border-input bg-[#FAF7F2] px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Sort By:
          </Label>
          <Select
            value={sortBy}
            onValueChange={(val) => onSortChange(val as SortOption)}
          >
            <SelectTrigger className="h-8 min-w-36 rounded-l-none rounded-r-md border border-input bg-white text-xs focus:ring-1 focus:ring-ring focus:outline-none dark:bg-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border border-input bg-popover text-xs text-popover-foreground shadow-md">
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center">
          <Label className="dark:bg-neutral-850 flex h-8 items-center rounded-l-md border border-r-0 border-input bg-[#FAF7F2] px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Show:
          </Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-8 min-w-16 rounded-l-none rounded-r-md border border-input bg-white text-xs focus:ring-1 focus:ring-ring focus:outline-none dark:bg-neutral-900">
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
