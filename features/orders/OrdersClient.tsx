"use client"

import { useTransition, useState } from "react"
import { useTranslations } from "next-intl"
import { Search, ClipboardList, ShoppingBag, ArrowUpDown } from "lucide-react"
import { Link, useRouter, usePathname } from "@/i18n/routing"
import { useSearchParams } from "next/navigation"
import PurchaseCard from "@/features/orders/PurchaseCard"
import type { ApiOrderGroup, OrderStatus } from "@/features/orders/api/type"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type FilterStatus = "all" | OrderStatus
type SortOption = "newest" | "oldest" | "highestTotal"

interface TabItem {
  key: FilterStatus
  labelKey: string
}

const TABS: TabItem[] = [
  { key: "all", labelKey: "statusAll" },
  { key: "Pending", labelKey: "statusPending" },
  { key: "Confirmed", labelKey: "statusConfirmed" },
  { key: "Preparing", labelKey: "statusPreparing" },
  { key: "Out For Delivery", labelKey: "statusOutForDelivery" },
  { key: "Delivered", labelKey: "statusDelivered" },
  { key: "Cancelled", labelKey: "statusCancelled" },
]

interface OrdersClientProps {
  orderGroups: ApiOrderGroup[]
  tabCounts: Record<string, number>
  activeStatus: FilterStatus
  searchQuery: string
  sortBy: SortOption
  currentPage: number
  totalPages: number
}

export default function OrdersClient({
  orderGroups,
  tabCounts,
  activeStatus,
  searchQuery,
  sortBy,
  currentPage,
  totalPages,
}: OrdersClientProps) {
  const t = useTranslations("Orders")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for instant controlled input typing synced with searchQuery prop during render
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery)
    setLocalSearch(searchQuery)
  }

  // Helper to push updated search params to URL (triggers RSC re-fetch/filter)
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || (key === "status" && value === "all") || (key === "sort" && value === "newest") || (key === "page" && value === "1")) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  // Handle Tab change
  const handleTabChange = (val: string) => {
    updateUrlParams({ status: val, page: "1" })
  }

  // Handle Search Input submit / change
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrlParams({ q: localSearch, page: "1" })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      updateUrlParams({ q: localSearch, page: "1" })
    }
  }

  // Handle Sort change
  const handleSortChange = (val: string | null) => {
    if (val) {
      updateUrlParams({ sort: val, page: "1" })
    }
  }

  // Handle Pagination change
  const handlePageChange = (page: number) => {
    updateUrlParams({ page: String(page) })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-start space-y-1">
        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[#1A0F0A] sm:text-4xl dark:text-neutral-100">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-[#6B4C3B] dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Static (Non-Sticky) Tabs Bar */}
      <div className="w-full py-2">
        <Tabs value={activeStatus} onValueChange={handleTabChange} className="w-full">
          <TabsList className="h-auto p-1 bg-[#F5EDE5]/80 dark:bg-neutral-850 rounded-full flex w-max min-w-full sm:min-w-0 overflow-x-auto gap-1 border border-[#ECE6DB] dark:border-neutral-800 scrollbar-none">
            {TABS.map((tab) => {
              const count = tabCounts[tab.key] || 0
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold data-active:bg-[#7C4A27] data-active:text-white dark:data-active:bg-[#C2733C] transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>{t(tab.labelKey )}</span>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 rounded-full text-[10px] font-bold bg-[#E2D9CE] text-[#4A2E1E] dark:bg-neutral-750 dark:text-neutral-300 group-data-active/tabs-trigger:bg-white/20 group-data-active/tabs-trigger:text-white"
                  >
                    {count}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Toolbar: Search Input + Sort Select */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => updateUrlParams({ q: localSearch, page: "1" })}
            placeholder={t("searchPlaceholder")}
            className="ps-9 h-10 rounded-full border-[#ECE6DB] bg-white dark:bg-neutral-900 dark:border-neutral-800 text-xs focus-visible:ring-[#7C4A27]"
          />
        </form>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
            <ArrowUpDown className="size-3.5 inline-block me-1" />
            {t("sortBy")}:
          </span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-10 min-w-[150px] rounded-full border-[#ECE6DB] bg-white dark:bg-neutral-900 dark:border-neutral-800 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#ECE6DB] dark:border-neutral-800">
              <SelectItem value="newest">{t("newest")}</SelectItem>
              <SelectItem value="oldest">{t("oldest")}</SelectItem>
              <SelectItem value="highestTotal">{t("highestTotal")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      <div className={isPending ? "opacity-60 transition-opacity" : ""}>
        {orderGroups.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              {orderGroups.map((group) => {
                return <PurchaseCard key={group.orderGroupId} order={group} />
              })}
            </div>

            {/* Pagination */}
            <div className="pt-4 flex justify-center">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        ) : (
          /* Empty State Card built on shadcn Card */
          <Card className="rounded-[28px] border-dashed border-[#ECE6DB] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-5 p-0">
              <div className="rounded-2xl bg-[#FAF2ED] dark:bg-neutral-800 p-5 text-[#7C4A27] dark:text-[#E68A49] shadow-2xs">
                <ClipboardList size={44} className="stroke-[1.5]" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-serif text-lg font-bold text-[#1A0F0A] dark:text-neutral-100">
                  {t("empty")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("emptyDesc")}
                </p>
              </div>
              <Button 
                nativeButton={false}
                render={<Link href="/offers" />}
                className="rounded-full bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432] shadow-xs px-6"
              >
                <ShoppingBag className="me-2 size-4" />
                <span>{t("browseOffers")}</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
