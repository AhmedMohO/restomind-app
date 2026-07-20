import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { getMyOrders } from "@/features/orders/api"
import OrdersClient from "@/features/orders/OrdersClient"
import { AlertCircle } from "lucide-react"
import type { OrderStatus, ApiOrder } from "@/features/orders/api/type"

export type FilterStatus = "all" | OrderStatus
export type SortOption = "newest" | "oldest" | "highestTotal"

const PAGE_SIZE = 6

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    status?: string
    q?: string
    sort?: string
    page?: string
  }>
}) {
  const { locale } = await params
  const { status, q, sort, page } = await searchParams

  setRequestLocale(locale)
  const t = await getTranslations("Orders")

  let allOrders: ApiOrder[] = []
  let fetchError: string | null = null

  try {
    const result = await getMyOrders()
    allOrders = result.data ?? []
  } catch (err) {
    console.error("[OrdersPage] Failed to fetch orders:", err)
    fetchError = err instanceof Error ? err.message : t("errorLoadingOrders")
  }

  if (fetchError) {
    return (
      <div className="container mx-auto min-h-[70vh] px-4 py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-rose-50 dark:bg-rose-950/30 p-5">
            <AlertCircle className="size-10 text-rose-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-bold text-[#2B1B15] dark:text-neutral-100">
              {t("errorLoadingOrders")}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">{fetchError}</p>
          </div>
        </div>
      </div>
    )
  }

  // 1. Calculate tab counts across all user orders
  const tabCounts: Record<string, number> = { all: allOrders.length }
  for (const order of allOrders) {
    tabCounts[order.status] = (tabCounts[order.status] || 0) + 1
  }

  // Active filter states from URL search params
  const activeStatus: FilterStatus =
    status && (status === "all" || ["Pending", "Confirmed", "Preparing", "Out For Delivery", "Delivered", "Cancelled"].includes(status))
      ? (status as FilterStatus)
      : "all"

  const searchQuery = q ? q.trim() : ""
  const sortBy: SortOption =
    sort && ["newest", "oldest", "highestTotal"].includes(sort)
      ? (sort as SortOption)
      : "newest"

  const currentPage = page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1

  // 2. Server-side Filtering
  let filtered = [...allOrders]

  if (activeStatus !== "all") {
    filtered = filtered.filter((o) => o.status === activeStatus)
  }

  if (searchQuery) {
    const queryLower = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (o) =>
        o._id.toLowerCase().includes(queryLower) ||
        o.restaurantId.name.toLowerCase().includes(queryLower)
    )
  }

  // Server-side Sorting
  filtered.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    if (sortBy === "highestTotal") {
      return b.finalTotalPrice - a.finalTotalPrice
    }
    return 0
  })

  // 3. Server-side Pagination
  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const paginatedOrders = filtered.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <div className="container mx-auto min-h-[70vh] px-4 py-8">
      <OrdersClient
        orders={paginatedOrders}
        tabCounts={tabCounts}
        activeStatus={activeStatus}
        searchQuery={searchQuery}
        sortBy={sortBy}
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
      />
    </div>
  )
}
