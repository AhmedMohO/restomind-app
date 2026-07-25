"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Receipt, RotateCcw, Sparkles, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { SortableHeader, TableState } from "@/components/ui/table-state"
import { useTableControls } from "@/hooks/use-table-controls"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { PaginatedProductSelect } from "@/features/products/components/paginated-product-select"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"
import {
  SALES_SOURCES,
  getLineDiscount,
  getSalesProductName,
  getSalesRestaurantName,
  type GetSalesSummaryParams,
  type SalesSortField,
  type SalesSource,
  ApiSalesTransaction,
} from "@/features/sales/api/type"
import { useSalesList, useSalesSummary } from "@/features/sales/hooks/use-sales"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { SalesSummaryCards } from "./sales-summary-cards"

const ALL_SOURCES = "all"

/** Today, as `yyyy-MM-dd`, used to block future dates in both pickers. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function SalesContainer() {
  const t = useTranslations("Dashboard.sales")
  const locale = useLocale()
  const { role } = useAuth()
  const isAdmin = role === "admin"

  const { page, setPage, resetPage, limit, setLimit, sort, order, toggleSort } =
    useTableControls<SalesSortField>({
      initialSort: "date",
      initialOrder: "desc",
    })

  const [startDate, setStartDateState] = React.useState("")
  const [endDate, setEndDateState] = React.useState("")
  const [source, setSourceState] = React.useState<SalesSource | "">("")
  const [productId, setProductIdState] = React.useState("")
  const [restaurantId, setRestaurantIdState] = React.useState("")

  // Every filter change invalidates the current page offset, so each setter
  // resets it in the same interaction rather than in a follow-up effect.
  const setStartDate = (value: string) => {
    setStartDateState(value)
    resetPage()
  }
  const setEndDate = (value: string) => {
    setEndDateState(value)
    resetPage()
  }
  const setSource = (value: SalesSource | "") => {
    setSourceState(value)
    resetPage()
  }
  const setProductId = (value: string) => {
    setProductIdState(value)
    resetPage()
  }
  const setRestaurantId = (value: string) => {
    setRestaurantIdState(value)
    resetPage()
  }

  // Managers are hard-scoped to their own restaurant upstream; sending a
  // restaurantId as a manager is rejected with 403, so it is never included.
  const filters: GetSalesSummaryParams = React.useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      source: source || undefined,
      productId: productId || undefined,
      restaurantId: isAdmin && restaurantId ? restaurantId : undefined,
    }),
    [startDate, endDate, source, productId, restaurantId, isAdmin]
  )

  const {
    data: salesPage,
    isLoading,
    isError,
    refetch,
  } = useSalesList({
    ...filters,
    page,
    limit,
    sort,
    order,
  })

  const { data: summary, isLoading: isSummaryLoading } =
    useSalesSummary(filters)

  const transactions = salesPage?.items ?? []
  const total = salesPage?.total ?? 0
  const totalPages = salesPage?.totalPages ?? 1

  const activeFilterCount = [
    startDate,
    endDate,
    source,
    productId,
    isAdmin ? restaurantId : "",
  ].filter(Boolean).length
  const isFiltered = activeFilterCount > 0

  const resetFilters = () => {
    setStartDateState("")
    setEndDateState("")
    setSourceState("")
    setProductIdState("")
    setRestaurantIdState("")
    resetPage()
  }

  const sourceLabel = source ? t(`source_${source}`) : t("allSources")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            <span>{t("title")}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {t("itemsCount", { count: total })}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? t("subtitleAdmin") : t("subtitleManager")}
          </p>
        </div>

        {isFiltered && (
          <Button
            variant="outline"
            onClick={resetFilters}
            className="gap-2 self-start rounded-xl sm:self-auto"
          >
            <RotateCcw className="size-4" />
            <span>{t("resetFilters")}</span>
            <Badge className="flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>

      <SalesSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* Filter bar */}
      <div className="grid gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("startDate")}</Label>
          <DatePicker
            value={startDate}
            onChange={(value) => setStartDate(value ?? "")}
            placeholder={t("anyDate")}
            allowFuture={false}
            // Never let the range invert — the API would return nothing.
            maxDate={parseIsoDate(endDate) ?? new Date()}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("endDate")}</Label>
          <DatePicker
            value={endDate}
            onChange={(value) => setEndDate(value ?? "")}
            placeholder={t("anyDate")}
            allowFuture={false}
            minDate={parseIsoDate(startDate)}
            maxDate={parseIsoDate(todayIso())}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("source")}</Label>
          <Select
            value={source || ALL_SOURCES}
            onValueChange={(value) =>
              setSource(value === ALL_SOURCES ? "" : (value as SalesSource))
            }
          >
            <SelectTrigger className="h-9 w-full rounded-xl text-xs">
              <SelectValue>{sourceLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SOURCES}>{t("allSources")}</SelectItem>
              {SALES_SOURCES.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`source_${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("product")}</Label>
          <PaginatedProductSelect
            value={productId}
            onValueChange={setProductId}
            placeholder={t("allProducts")}
            restaurantId={isAdmin ? restaurantId || undefined : undefined}
          />
        </div>

        {isAdmin && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("restaurant")}</Label>
            <PaginatedRestaurantSelect
              value={restaurantId}
              onValueChange={(value) => {
                setRestaurantId(value)
                // The product filter is restaurant-scoped; a stale product from
                // another restaurant would return an empty ledger.
                setProductId("")
              }}
              placeholder={t("allRestaurants")}
            />
          </div>
        )}
      </div>

      <div className="max-h-[70vh] w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={transactions.length === 0}
          onRetry={() => refetch()}
          errorText={t("fetchError")}
          retryText={t("retry")}
          emptyIcon={Receipt}
          emptyTitle={isFiltered ? t("noMatches") : t("emptyTitle")}
          emptyDescription={
            isFiltered ? t("noMatchesDesc") : t("emptyDescription")
          }
          onClearFilters={isFiltered ? resetFilters : undefined}
          clearFiltersText={t("resetFilters")}
        >
          <Table className="min-w-[1040px] sm:min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-card shadow-xs">
              <TableRow>
                <TableHead className="w-[15%] min-w-[150px] text-start">
                  <SortableHeader
                    field="date"
                    activeField={sort ?? ""}
                    order={order}
                    onSort={toggleSort}
                  >
                    {t("colDate")}
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[22%] min-w-[170px] text-start">
                  {t("colProduct")}
                </TableHead>
                {isAdmin && (
                  <TableHead className="w-[16%] min-w-[140px] text-start">
                    {t("colRestaurant")}
                  </TableHead>
                )}
                <TableHead className="w-[9%] min-w-[80px] px-4 text-end">
                  <SortableHeader
                    field="quantitySold"
                    activeField={sort ?? ""}
                    order={order}
                    onSort={toggleSort}
                    align="end"
                  >
                    {t("colQuantity")}
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[11%] min-w-[100px] px-4 text-end">
                  {t("colBasePrice")}
                </TableHead>
                <TableHead className="w-[11%] min-w-[110px] px-4 text-end">
                  <SortableHeader
                    field="sellingPrice"
                    activeField={sort ?? ""}
                    order={order}
                    onSort={toggleSort}
                    align="end"
                  >
                    {t("colSellingPrice")}
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[11%] min-w-[110px] px-4 text-end">
                  {t("colLineTotal")}
                </TableHead>
                <TableHead className="w-[14%] min-w-[150px] text-start">
                  {t("colSource")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction: ApiSalesTransaction) => {
                const lineTotal =
                  transaction.sellingPrice * transaction.quantitySold
                const discount = getLineDiscount(transaction)

                return (
                  <TableRow
                    key={transaction._id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(transaction.date, locale)}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      <span className="block max-w-[220px] truncate">
                        {getSalesProductName(transaction.productId)}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-sm">
                        <span className="block max-w-[180px] truncate">
                          {getSalesRestaurantName(transaction.restaurantId)}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="px-4 text-end font-medium">
                      {formatNumber(transaction.quantitySold, locale)}
                    </TableCell>
                    <TableCell className="px-4 text-end text-sm text-muted-foreground">
                      {formatCurrency(transaction.basePrice, locale, 2)}
                    </TableCell>
                    <TableCell className="px-4 text-end text-sm font-medium">
                      {formatCurrency(transaction.sellingPrice, locale, 2)}
                      {discount > 0 && (
                        <span className="block text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                          −{formatCurrency(discount, locale, 2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-end font-semibold">
                      {formatCurrency(lineTotal, locale, 2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {t(`source_${transaction.source}`)}
                        </Badge>
                        {transaction.promotionActive && (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-[10px]"
                            title={t("promotionActive")}
                          >
                            <Sparkles className="size-3" />
                            {t("promotionActive")}
                          </Badge>
                        )}
                        {transaction.featured && (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-[10px]"
                            title={t("featured")}
                          >
                            <Star className="size-3" />
                            {t("featured")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableState>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  )
}
