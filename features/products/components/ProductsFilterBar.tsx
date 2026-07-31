"use client"

import React, { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useRouter, usePathname } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProductsFilterBarProps {
  startTransition?: React.TransitionStartFunction
}

export function ProductsFilterBar({ startTransition }: ProductsFilterBarProps) {
  const t = useTranslations("Offers")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlQuery = searchParams.get("q") || ""
  const currentSort = searchParams.get("sort") || "default"
  const currentLimit = searchParams.get("limit") || "12"

  const [searchTerm, setSearchTerm] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)

  // Sync local input when URL `q` changes externally
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    setSearchTerm(urlQuery)
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm === urlQuery) return
      const params = new URLSearchParams(searchParams.toString())
      params.delete("page")
      if (searchTerm.trim()) {
        params.set("q", searchTerm.trim())
      } else {
        params.delete("q")
      }
      const transition = startTransition || ((cb: () => void) => cb())
      transition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [searchTerm, urlQuery, searchParams, router, pathname, startTransition])

  const handleSortChange = (newSort: string | null) => {
    if (!newSort) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    if (newSort === "default") {
      params.delete("sort")
    } else {
      params.set("sort", newSort)
    }
    const transition = startTransition || ((cb: () => void) => cb())
    transition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleLimitChange = (newLimit: string | null) => {
    if (!newLimit) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    if (newLimit === "12") {
      params.delete("limit")
    } else {
      params.set("limit", newLimit)
    }
    const transition = startTransition || ((cb: () => void) => cb())
    transition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECE6DB] pb-4 dark:border-neutral-800">
      {/* Search Input */}
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-8 w-full rounded-xl border border-[#ECE6DB] bg-white py-2 ps-9 pe-4 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>

      {/* Sorting & Limit selectors */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort selector */}
        <div className="inline-flex items-center">
          <Label htmlFor="sort-by-select" className="flex h-8 cursor-pointer items-center rounded-s-xl border border-e-0 border-[#ECE6DB] bg-[#FAF7F2] px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase dark:border-neutral-800 dark:bg-neutral-800/80">
            {t("sortBy")}
          </Label>
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger
              id="sort-by-select"
              size="sm"
              aria-label={t("sortBy")}
              className="h-8 rounded-s-none rounded-e-xl border-[#ECE6DB] bg-white px-3 text-xs focus:ring-primary dark:border-neutral-800 dark:bg-neutral-900"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t("sortDefault")}</SelectItem>
              <SelectItem value="price-asc">{t("sortPriceAsc")}</SelectItem>
              <SelectItem value="price-desc">{t("sortPriceDesc")}</SelectItem>
              <SelectItem value="rating-desc">{t("sortRatingDesc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page size selector */}
        <div className="inline-flex items-center">
          <Label htmlFor="limit-select" className="flex h-8 cursor-pointer items-center rounded-s-xl border border-e-0 border-[#ECE6DB] bg-[#FAF7F2] px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase dark:border-neutral-800 dark:bg-neutral-800/80">
            {t("show")}
          </Label>
          <Select value={currentLimit} onValueChange={handleLimitChange}>
            <SelectTrigger
              id="limit-select"
              size="sm"
              aria-label={t("show")}
              className="h-8 rounded-s-none rounded-e-xl border-[#ECE6DB] bg-white px-3 text-xs focus:ring-primary dark:border-neutral-800 dark:bg-neutral-900"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
