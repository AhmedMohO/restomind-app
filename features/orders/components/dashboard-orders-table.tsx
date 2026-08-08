"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { RotateCcw, Search, ShoppingBag } from "lucide-react"
import { useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TablePagination } from "@/components/ui/table-pagination"
import { TableState } from "@/components/ui/table-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useTableControls } from "@/hooks/use-table-controls"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { UserRole } from "@/features/auth/auth"
import type {
  DashboardOrderRow,
  QueryOrderListingParams,
} from "@/features/orders/api/dashboard-types"
import {
  useDashboardOrders,
  useDashboardOrdersSummary,
} from "@/features/orders/hooks/use-dashboard-orders"
import {
  DEFAULT_ORDER_FILTERS,
  DashboardOrdersFilters,
  TOTAL_PRICE_MAX,
  TOTAL_PRICE_MIN,
  countActiveFilters,
  type OrderFilters,
} from "@/features/orders/components/dashboard-orders-filters"
import { OrdersProgressCard } from "@/features/orders/components/orders-progress-card"
import { IssueRefundDialog } from "@/features/refunds/components/issue-refund-dialog"

interface DashboardOrdersTableProps {
  /** Drives the copy and whether cross-restaurant controls are shown. */
  role: UserRole
}

/**
 * Orders table for every dashboard role.
 *
 * Admins list group orders across all restaurants; managers and staff list
 * their own restaurant's orders (scoping happens in the BFF, never here).
 * Statuses are not shown or edited in the list — completion is summarised by
 * `OrdersProgressCard` and statuses are changed on the details screen.
 */
export function DashboardOrdersTable({ role }: DashboardOrdersTableProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.orders")
  const router = useRouter()
  const isAdmin = role === "admin"

  const { page, setPage, resetPage, limit, setLimit } = useTableControls()

  // Admin only: the refund endpoint rejects every other role, so showing the
  // action to a manager would render a button that always fails.
  const [refundTarget, setRefundTarget] =
    React.useState<DashboardOrderRow | null>(null)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [filters, setFilters] = React.useState<OrderFilters>(
    DEFAULT_ORDER_FILTERS
  )

  React.useEffect(() => {
    resetPage()
  }, [debouncedSearch, resetPage])

  const setFilter = React.useCallback(
    <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      resetPage()
    },
    [resetPage]
  )

  const resetFilters = React.useCallback(() => {
    setFilters(DEFAULT_ORDER_FILTERS)
    setSearch("")
    resetPage()
  }, [resetPage])

  const [minTotal, maxTotal] = filters.totalPriceRange
  const filterParams: QueryOrderListingParams = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      deliveryMethod: filters.deliveryMethod || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      minTotalPrice: minTotal > TOTAL_PRICE_MIN ? minTotal : undefined,
      maxTotalPrice: maxTotal < TOTAL_PRICE_MAX ? maxTotal : undefined,
      restaurantId: isAdmin ? filters.restaurantId || undefined : undefined,
      sortBy: "createdAt",
      sort: "createdAt",
      sortOrder: filters.sortOrder,
      order: filters.sortOrder,
    }),
    [debouncedSearch, filters, isAdmin, maxTotal, minTotal]
  )

  const { data, isLoading, isError, refetch } = useDashboardOrders({
    ...filterParams,
    page,
    limit,
  })
  const summary = useDashboardOrdersSummary(filterParams)

  const orders = data?.data ?? []
  const isFiltered = countActiveFilters(filters) > 0 || Boolean(debouncedSearch)

  const openOrder = (id: string) => {
    if (id) router.push(`/dashboard/orders/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {isAdmin ? t("adminTitle") : t("restaurantTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? t("adminSubtitle") : t("restaurantSubtitle")}
          </p>
        </div>
      </div>

      <OrdersProgressCard
        done={summary.data?.done ?? 0}
        total={summary.data?.total ?? 0}
        isLoading={summary.isLoading}
      />

      <div className="flex w-full flex-row items-center justify-between gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="rounded-xl ps-9"
          />
        </div>
        <DashboardOrdersFilters
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          showRestaurantFilter={isAdmin}
        />
      </div>

      <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card shadow-2xs">
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={orders.length === 0}
          onRetry={() => refetch()}
          errorText={t("fetchError")}
          retryText={t("retry")}
          emptyIcon={ShoppingBag}
          emptyTitle={t("noOrders")}
          onClearFilters={isFiltered ? resetFilters : undefined}
          clearFiltersText={t("resetFilters")}
        >
          <Table className="min-w-[860px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t("colOrder")}</TableHead>
                <TableHead className="text-start">{t("colCustomer")}</TableHead>
                {isAdmin && (
                  <TableHead className="text-start">
                    {t("colRestaurant")}
                  </TableHead>
                )}
                <TableHead className="text-start">{t("colTotal")}</TableHead>
                <TableHead className="text-start">{t("colDelivery")}</TableHead>
                <TableHead className="text-start">
                  {t("colCreatedAt")}
                </TableHead>
                {/* {isAdmin && (
                  <TableHead className="text-end">{t("colActions")}</TableHead>
                )} */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: DashboardOrderRow) => (
                <TableRow
                  key={order.id || order.reference}
                  className="cursor-pointer hover:bg-accent/40"
                  onClick={() => openOrder(order.id)}
                >
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-primary">
                      #{order.reference}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col">
                      <span className="max-w-[160px] truncate font-semibold">
                        {order.customerName}
                      </span>
                      <span className="max-w-[190px] truncate text-xs text-muted-foreground">
                        {order.customerContact}
                      </span>
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="max-w-[180px] truncate">
                      {order.restaurantName}
                    </TableCell>
                  )}
                  <TableCell className="font-semibold">
                    {formatCurrency(order.finalTotalPrice, locale)}
                    <span className="ms-1 text-xs text-muted-foreground">
                      ({order.totalQuantity})
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                    {order.deliveryMethod === "Home Delivery"
                      ? t("homeDelivery")
                      : order.deliveryMethod === "Store Pickup"
                        ? t("storePickup")
                        : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt, locale)}
                  </TableCell>
                  {/* {isAdmin && (
                    <TableCell
                      className="text-end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRefundTarget(order)}
                        className="h-8 gap-1.5 rounded-xl text-xs"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>{t("issueRefund")}</span>
                      </Button>
                    </TableCell>
                  )} */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableState>
      </div>

      <TablePagination
        page={data?.currentPage ?? page}
        totalPages={data?.totalPages ?? 1}
        total={data?.totalItems ?? 0}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <IssueRefundDialog
        groupId={refundTarget?.id ?? null}
        reference={refundTarget?.reference}
        open={Boolean(refundTarget)}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        onIssued={() => refetch()}
      />
    </div>
  )
}
