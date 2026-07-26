import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { getAllMyOrders } from "@/features/orders/api"
import OrdersClient from "@/features/orders/components/OrdersClient"
import { AlertCircle } from "lucide-react"
import { ORDER_STATUSES } from "@/features/orders/status"
import type { ApiOrderGroup, OrderStatus } from "@/features/orders/api/type"

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

  let orderGroups: ApiOrderGroup[] = []
  let fetchError: string | null = null

  try {
    // The endpoint paginates but exposes no search/sort, so the full history is
    // loaded once and filtered, sorted and paginated below.
    orderGroups = await getAllMyOrders()
  } catch (err) {
    console.error("[OrdersPage] Failed to fetch orders:", err)
    fetchError = err instanceof Error ? err.message : t("errorLoadingOrders")
  }

  if (fetchError) {
    return (
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-rose-50 p-5 dark:bg-rose-950/30">
            <AlertCircle className="size-10 text-rose-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-bold text-foreground">
              {t("errorLoadingOrders")}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {fetchError}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tabCounts: Record<string, number> = { all: orderGroups.length }
  for (const group of orderGroups) {
    tabCounts[group.overallStatus] = (tabCounts[group.overallStatus] || 0) + 1
  }

  const activeStatus: FilterStatus =
    status &&
    (status === "all" || ORDER_STATUSES.includes(status as OrderStatus))
      ? (status as FilterStatus)
      : "all"

  const searchQuery = q ? q.trim() : ""
  const sortBy: SortOption =
    sort && ["newest", "oldest", "highestTotal"].includes(sort)
      ? (sort as SortOption)
      : "newest"

  const currentPage =
    page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1

  let filtered = [...orderGroups]

  if (activeStatus !== "all") {
    filtered = filtered.filter((group) => group.overallStatus === activeStatus)
  }

  if (searchQuery) {
    const queryLower = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (group) =>
        group.groupOrderId.toLowerCase().includes(queryLower) ||
        group.fullName.toLowerCase().includes(queryLower) ||
        group.phoneNumber.toLowerCase().includes(queryLower) ||
        group.emailAddress.toLowerCase().includes(queryLower) ||
        (group.orders ?? []).some(
          (order) =>
            order.orderId.toLowerCase().includes(queryLower) ||
            order.restaurant.name.toLowerCase().includes(queryLower) ||
            order.items.some((item) =>
              item.title.toLowerCase().includes(queryLower)
            )
        )
    )
  }

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

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const paginatedOrderGroups = filtered.slice(
    startIndex,
    startIndex + PAGE_SIZE
  )

  return (
    <div className="container mx-auto min-h-[70vh] px-4 py-8">
      <OrdersClient
        orderGroups={paginatedOrderGroups}
        tabCounts={tabCounts}
        activeStatus={activeStatus}
        searchQuery={searchQuery}
        sortBy={sortBy}
        currentPage={safePage}
        totalPages={totalPages}
      />
    </div>
  )
}
