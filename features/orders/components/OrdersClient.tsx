"use client"

import {
  useTransition,
  useState,
  createContext,
  useContext,
  useEffect,
} from "react"
import { useTranslations } from "next-intl"
import { Search, ClipboardList, ShoppingBag, ArrowUpDown } from "lucide-react"
import { Link, useRouter, usePathname } from "@/i18n/routing"
import { useSearchParams } from "next/navigation"
import PurchaseCard from "@/features/orders/components/PurchaseCard"
import { ORDER_STATUSES, getStatusMeta } from "@/features/orders/status"
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
import { Skeleton } from "@/components/ui/skeleton"

type FilterStatus = "all" | OrderStatus
type SortOption = "newest" | "oldest" | "highestTotal"

interface TabItem {
  key: FilterStatus
  labelKey: string
}

/** One tab per status, kept in sync with the shared status list. */
const TABS: TabItem[] = [
  { key: "all", labelKey: "statusAll" },
  ...ORDER_STATUSES.map((status) => ({
    key: status as FilterStatus,
    labelKey: getStatusMeta(status).labelKey,
  })),
]

const TabCountsContext = createContext<{
  tabCounts: Record<string, number> | null
  setTabCounts: (counts: Record<string, number>) => void
}>({
  tabCounts: null,
  setTabCounts: () => {},
})

export function OrdersContentList({
  orderGroups,
  tabCounts,
  currentPage,
  totalPages,
}: {
  orderGroups: ApiOrderGroup[]
  tabCounts: Record<string, number>
  currentPage: number
  totalPages: number
}) {
  const t = useTranslations("Orders")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setTabCounts } = useContext(TabCountsContext)

  useEffect(() => {
    setTabCounts(tabCounts)
  }, [tabCounts, setTabCounts])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete("page")
    } else {
      params.set("page", String(page))
    }
    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(url, { scroll: false })
  }

  if (orderGroups.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {orderGroups.map((group) => (
          <PurchaseCard key={group.groupOrderId} order={group} />
        ))}
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
  )
}

interface OrdersClientProps {
  activeStatus: FilterStatus
  searchQuery: string
  sortBy: SortOption
  children: React.ReactNode
}

export default function OrdersClient({
  activeStatus,
  searchQuery,
  sortBy,
  children,
}: OrdersClientProps) {
  const t = useTranslations("Orders")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [tabCounts, setTabCounts] = useState<Record<string, number> | null>(
    null
  )

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
      if (
        value === null ||
        value === "" ||
        (key === "status" && value === "all") ||
        (key === "sort" && value === "newest") ||
        (key === "page" && value === "1")
      ) {
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

  return (
    <TabCountsContext.Provider value={{ tabCounts, setTabCounts }}>
      <div className="space-y-6">
        {/* Page Header — Instant Static Shell */}
        <div className="space-y-1 text-start">
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {t("subtitle")}
          </p>
        </div>

        {/* Tabs — Instant Static Shell */}
        <Tabs value={activeStatus} onValueChange={handleTabChange}>
          <TabsList className="flex h-fit! flex-wrap gap-1 rounded-full border border-border">
            {TABS.map((tab) => {
              const count = tabCounts?.[tab.key]
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all data-active:bg-primary data-active:text-primary-foreground"
                >
                  <span>{t(tab.labelKey)}</span>
                  <Badge
                    variant="secondary"
                    className="h-4 rounded-full bg-muted-foreground/45 px-1.5 text-[10px] font-bold text-muted group-data-active/tabs-trigger:bg-primary-foreground/20 group-data-active/tabs-trigger:text-primary-foreground"
                  >
                    {count !== undefined ? (
                      count
                    ) : (
                      <Skeleton className="h-2.5 w-3 rounded-full bg-muted-foreground/30" />
                    )}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {/* Toolbar: Search Input + Sort Select — Instant Static Shell */}
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative max-w-md flex-1"
          >
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

        {/* Dynamic Orders Content Area (Streamed inside Suspense) */}
        <div className={isPending ? "opacity-60 transition-opacity" : ""}>
          {children}
        </div>
      </div>
    </TabCountsContext.Provider>
  )
}
