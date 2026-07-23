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
      <div className="space-y-1 text-start">
        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {t("subtitle")}
        </p>
      </div>

      {/* Static (Non-Sticky) Tabs Bar */}
      <div className="w-full py-2">
        <Tabs value={activeStatus} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex h-auto w-max min-w-full gap-1 overflow-x-auto rounded-full border border-border bg-muted/70 p-1 scrollbar-none sm:min-w-0">
            {TABS.map((tab) => {
              const count = tabCounts[tab.key] || 0
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all data-active:bg-primary data-active:text-primary-foreground"
                >
                  <span>{t(tab.labelKey)}</span>
                  <Badge
                    variant="secondary"
                    className="h-4 rounded-full bg-muted-foreground/15 px-1.5 text-[10px] font-bold text-muted-foreground group-data-active/tabs-trigger:bg-primary-foreground/20 group-data-active/tabs-trigger:text-primary-foreground"
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
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => updateUrlParams({ q: localSearch, page: "1" })}
            placeholder={t("searchPlaceholder")}
            className="h-10 rounded-full border-input bg-background ps-9 text-xs focus-visible:ring-primary"
          />
        </form>

        {/* Sort Dropdown */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">
            <ArrowUpDown className="me-1 inline-block size-3.5" />
            {t("sortBy")}:
          </span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-10 min-w-[150px] rounded-full border-input bg-background text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover">
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
            <div className="flex justify-center pt-4">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        ) : (
          /* Empty State Card built on shadcn Card */
          <Card className="rounded-[28px] border-dashed border-border bg-card p-8 py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-5 p-0">
              <div className="rounded-2xl bg-muted p-5 text-primary shadow-2xs">
                <ClipboardList size={44} className="stroke-[1.5]" />
              </div>
              <div className="max-w-sm space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  {t("empty")}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("emptyDesc")}
                </p>
              </div>
              <Button
                nativeButton={false}
                render={<Link href="/offers" />}
                className="rounded-full bg-primary px-6 text-primary-foreground shadow-xs hover:bg-primary/90"
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
