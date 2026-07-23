"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  ArrowUpDown,
  Calendar,
  CreditCard,
  Eye,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
  Tag,
  Truck,
  Wallet,
  X,
} from "lucide-react"
import { useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { TablePagination } from "@/components/ui/table-pagination"
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
import { getErrorMessage } from "@/lib/api/utils"
import type { OrderStatus } from "@/features/orders/api/type"
import type { ApiRestaurantOrder, QueryOrderListingParams } from "@/features/orders/api/dashboard-types"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"
import {
  useAdminOrdersList,
  useUpdateAdminOrderStatus,
} from "@/features/orders/hooks/use-admin-orders"
import {
  ORDER_STATUS_OPTIONS,
  OrderStatusSelect,
} from "@/features/orders/components/order-status-select"
import { getStatusMeta } from "@/features/orders/status"
import { formatCurrency , formatDate} from "@/lib/utils"
const ALL = "all"
const TOTAL_PRICE_MIN = 0
const TOTAL_PRICE_MAX = 5000
const DELIVERY_METHOD_OPTIONS = ["Home Delivery", "Store Pickup"] as const
const PAYMENT_METHOD_OPTIONS = ["Cash on Delivery", "Credit / Debit Card"] as const



function getOrderId(order: ApiRestaurantOrder) {
  return order._id ?? order.orderId
}

export function AdminOrdersTable() {
  const locale = useLocale()
  const t = useTranslations("Dashboard.orders")
  const tOrders = useTranslations("Orders")
  const router = useRouter()

  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [status, setStatus] = React.useState<OrderStatus | "">("")
  const [paymentMethod, setPaymentMethod] = React.useState("")
  const [deliveryMethod, setDeliveryMethod] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [totalPriceRange, setTotalPriceRange] = React.useState<[number, number]>([
    TOTAL_PRICE_MIN,
    TOTAL_PRICE_MAX,
  ])
  const [restaurantId, setRestaurantId] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const queryParams: QueryOrderListingParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: status || undefined,
    paymentMethod: paymentMethod || undefined,
    deliveryMethod: deliveryMethod || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    minTotalPrice:
      totalPriceRange[0] > TOTAL_PRICE_MIN ? totalPriceRange[0] : undefined,
    maxTotalPrice:
      totalPriceRange[1] < TOTAL_PRICE_MAX ? totalPriceRange[1] : undefined,
    restaurantId: restaurantId || undefined,
    sortBy: "createdAt",
    sort: "createdAt",
    sortOrder,
    order: sortOrder,
  }

  const { data, isLoading, isError, refetch } = useAdminOrdersList(queryParams)
  const updateStatus = useUpdateAdminOrderStatus()

  const orders = data?.data ?? []
  const total = data?.totalItems ?? 0
  const totalPages = data?.totalPages ?? 1

  const resetFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setStatus("")
    setPaymentMethod("")
    setDeliveryMethod("")
    setStartDate("")
    setEndDate("")
    setTotalPriceRange([TOTAL_PRICE_MIN, TOTAL_PRICE_MAX])
    setRestaurantId("")
    setSortOrder("desc")
    setPage(1)
  }

  const activeFilterCount = [
    status,
    paymentMethod,
    deliveryMethod,
    startDate,
    endDate,
    restaurantId,
    sortOrder !== "desc" ? sortOrder : "",
    totalPriceRange[0] > TOTAL_PRICE_MIN ||
    totalPriceRange[1] < TOTAL_PRICE_MAX
      ? "price"
      : "",
  ].filter(Boolean).length

  const updateTotalPriceRange = (next: [number, number]) => {
    const min = Math.max(TOTAL_PRICE_MIN, Math.min(next[0], TOTAL_PRICE_MAX))
    const max = Math.max(min, Math.min(next[1], TOTAL_PRICE_MAX))
    setTotalPriceRange([min, max])
    setPage(1)
  }

  const handleStatusChange = async (order: ApiRestaurantOrder, next: OrderStatus) => {
    const id = getOrderId(order)
    if (!id || next === order.status) return

    setUpdatingId(id)
    try {
      await updateStatus.mutateAsync({ id, status: next })
      toast.success(t("statusUpdateSuccess"))
    } catch (err) {
      console.error("[AdminOrdersTable] status update failed", err)
      toast.error(getErrorMessage(err, t("statusUpdateError")))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{t("adminTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminSubtitle")}</p>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto">
                <SlidersHorizontal className="size-4" />
                <span>{t("filters")}</span>
                {activeFilterCount > 0 && (
                  <Badge className="flex size-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            }
          />
          <SheetContent
            side="right"
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="flex h-full w-full max-w-md flex-col overflow-hidden p-0 sm:max-w-md"
          >
            {/* Sheet Header */}
            <SheetHeader className="border-b border-border bg-card/60 p-5 text-start backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Filter className="size-5" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold tracking-tight">
                    {t("filtersTitle")}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {t("filtersDescription")}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Sheet Body */}
            <div className="flex-1 overflow-y-auto space-y-4 p-5">
              {/* Status & Sort Order Section */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-2xs">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Status Filter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Tag className="size-3.5 text-primary" />
                        <span>{t("statusFilter")}</span>
                      </Label>
                      {status && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatus("")
                            setPage(1)
                          }}
                          className="text-[11px] font-medium text-primary hover:underline"
                        >
                          {t("resetFilters")}
                        </button>
                      )}
                    </div>
                    <Select
                      value={status || ALL}
                      onValueChange={(value) => {
                        setStatus(value === ALL ? "" : (value as OrderStatus))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-full h-9 rounded-xl border-input bg-background text-xs">
                        <SelectValue>
                          {status ? (
                            <span className="inline-flex items-center gap-2 font-medium">
                              {React.createElement(getStatusMeta(status).Icon, {
                                className: "size-3.5 text-primary",
                              })}
                              <span>{tOrders(getStatusMeta(status).labelKey)}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t("allStatuses")}</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>
                          <span className="font-medium text-foreground">{t("allStatuses")}</span>
                        </SelectItem>
                        {ORDER_STATUS_OPTIONS.map((option) => {
                          const meta = getStatusMeta(option)
                          const IconComp = meta.Icon
                          return (
                            <SelectItem key={option} value={option}>
                              <span className="inline-flex items-center gap-2">
                                <IconComp className="size-3.5 text-muted-foreground" />
                                <span>{tOrders(meta.labelKey)}</span>
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order Filter */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ArrowUpDown className="size-3.5 text-primary" />
                      <span>{t("sortOrder")}</span>
                    </Label>
                    <Select
                      value={sortOrder}
                      onValueChange={(value) => {
                        setSortOrder(value as "asc" | "desc")
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-full h-9 rounded-xl border-input bg-background text-xs">
                        <SelectValue>
                          <span className="inline-flex items-center gap-2 font-medium">
                            <ArrowUpDown className="size-3.5 text-primary" />
                            <span>{sortOrder === "desc" ? t("newestFirst") : t("oldestFirst")}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">
                          <span className="inline-flex items-center gap-2">
                            <span>{t("newestFirst")}</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="asc">
                          <span className="inline-flex items-center gap-2">
                            <span>{t("oldestFirst")}</span>
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Restaurant Section */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Store className="size-3.5 text-primary" />
                    <span>{t("restaurant")}</span>
                  </Label>
                  {restaurantId && (
                    <button
                      type="button"
                      onClick={() => {
                        setRestaurantId("")
                        setPage(1)
                      }}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      {t("resetFilters")}
                    </button>
                  )}
                </div>
                <PaginatedRestaurantSelect
                  value={restaurantId}
                  onValueChange={(value) => {
                    setRestaurantId(value)
                    setPage(1)
                  }}
                />
              </div>

              {/* Fulfillment & Payment Section */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3.5 shadow-2xs">
                <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Truck className="size-3.5 text-primary" />
                  <span>{t("fulfillment")}</span>
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("deliveryMethod")}
                    </Label>
                    <Select
                      value={deliveryMethod || ALL}
                      onValueChange={(value) => {
                        setDeliveryMethod(!value || value === ALL ? "" : value)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-full h-9 rounded-xl border-input bg-background text-xs">
                        <SelectValue>
                          {deliveryMethod === "Home Delivery" ? (
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <Truck className="size-3.5 text-primary" />
                              <span>{t("homeDelivery")}</span>
                            </span>
                          ) : deliveryMethod === "Store Pickup" ? (
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <Store className="size-3.5 text-primary" />
                              <span>{t("storePickup")}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t("allDeliveryMethods")}</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>
                          <span className="font-medium text-foreground">{t("allDeliveryMethods")}</span>
                        </SelectItem>
                        {DELIVERY_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            <span className="inline-flex items-center gap-2">
                              {option === "Home Delivery" ? (
                                <Truck className="size-3.5 text-muted-foreground" />
                              ) : (
                                <Store className="size-3.5 text-muted-foreground" />
                              )}
                              <span>
                                {option === "Home Delivery" ? t("homeDelivery") : t("storePickup")}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("paymentMethod")}
                    </Label>
                    <Select
                      value={paymentMethod || ALL}
                      onValueChange={(value) => {
                        setPaymentMethod(!value || value === ALL ? "" : value)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-full h-9 rounded-xl border-input bg-background text-xs">
                        <SelectValue>
                          {paymentMethod === "Cash on Delivery" ? (
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <Wallet className="size-3.5 text-primary" />
                              <span>{t("cashOnDelivery")}</span>
                            </span>
                          ) : paymentMethod === "Credit / Debit Card" ? (
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <CreditCard className="size-3.5 text-primary" />
                              <span>{t("creditDebitCard")}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t("allPaymentMethods")}</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>
                          <span className="font-medium text-foreground">{t("allPaymentMethods")}</span>
                        </SelectItem>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            <span className="inline-flex items-center gap-2">
                              {option === "Cash on Delivery" ? (
                                <Wallet className="size-3.5 text-muted-foreground" />
                              ) : (
                                <CreditCard className="size-3.5 text-muted-foreground" />
                              )}
                              <span>
                                {option === "Cash on Delivery"
                                  ? t("cashOnDelivery")
                                  : t("creditDebitCard")}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Date Range Section */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-2xs">
                <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Calendar className="size-3.5 text-primary" />
                  <span>{t("startDate")} / {t("endDate")}</span>
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("startDate")}
                    </Label>
                    <DatePicker
                      value={startDate}
                      onChange={(value) => {
                        setStartDate(value ?? "")
                        setPage(1)
                      }}
                      placeholder={t("startDate")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("endDate")}
                    </Label>
                    <DatePicker
                      value={endDate}
                      onChange={(value) => {
                        setEndDate(value ?? "")
                        setPage(1)
                      }}
                      placeholder={t("endDate")}
                    />
                  </div>
                </div>
              </div>

              {/* Price Range Section */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Wallet className="size-3.5 text-primary" />
                    <span>{t("totalPriceRange")}</span>
                  </Label>
                  <Badge variant="secondary" className="px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {locale === "ar" ? (
                      <span className="inline-flex items-center gap-1 font-sans" dir="rtl">
                        <span>من</span>
                        <span>{formatCurrency(totalPriceRange[0], locale)}</span>
                        <span>إلى</span>
                        <span>{formatCurrency(totalPriceRange[1], locale)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono" dir="ltr">
                        <span>{formatCurrency(totalPriceRange[0], locale)}</span>
                        <span>–</span>
                        <span>{formatCurrency(totalPriceRange[1], locale)}</span>
                      </span>
                    )}
                  </Badge>
                </div>
                <div dir="ltr" className="space-y-3.5">
                  <Slider
                    dir="ltr"
                    min={TOTAL_PRICE_MIN}
                    max={TOTAL_PRICE_MAX}
                    step={5}
                    value={totalPriceRange}
                    onValueChange={(value) =>
                      updateTotalPriceRange(value as [number, number])
                    }
                    className="py-2"
                  />
                  <div className="grid grid-cols-2 gap-3" dir="ltr">
                    <div className="space-y-1 text-center">
                      <Label className="text-[11px] font-medium text-muted-foreground">{t("minTotal")}</Label>
                      <Input
                        type="number"
                        min={TOTAL_PRICE_MIN}
                        max={totalPriceRange[1]}
                        value={totalPriceRange[0]}
                        onChange={(e) =>
                          updateTotalPriceRange([
                            Number(e.target.value || TOTAL_PRICE_MIN),
                            totalPriceRange[1],
                          ])
                        }
                        className="h-8 rounded-xl text-center text-xs"
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <Label className="text-[11px] font-medium text-muted-foreground">{t("maxTotal")}</Label>
                      <Input
                        type="number"
                        min={totalPriceRange[0]}
                        max={TOTAL_PRICE_MAX}
                        value={totalPriceRange[1]}
                        onChange={(e) =>
                          updateTotalPriceRange([
                            totalPriceRange[0],
                            Number(e.target.value || TOTAL_PRICE_MAX),
                          ])
                        }
                        className="h-8 rounded-xl text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <SheetFooter className="border-t border-border bg-card/60 p-4 backdrop-blur-xs">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full gap-2 rounded-xl text-xs font-medium"
              >
                <RotateCcw className="size-3.5" />
                <span>{t("resetFilters")}</span>
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search toolbar */}
      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-full flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9 rounded-xl"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card shadow-2xs">
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("fetchError")}</p>
            <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
              {t("retry")}
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
          </div>
        ) : (
          <Table className="min-w-[980px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t("colOrder")}</TableHead>
                <TableHead className="text-start">{t("colCustomer")}</TableHead>
                <TableHead className="text-start">{t("colRestaurant")}</TableHead>
                <TableHead className="text-start">{t("colTotal")}</TableHead>
                <TableHead className="text-start">{t("colDelivery")}</TableHead>
                <TableHead className="text-start">{t("colStatus")}</TableHead>
                <TableHead className="text-start">{t("colCreatedAt")}</TableHead>
                <TableHead className="text-start">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const id = getOrderId(order)
                const groupId = order.groupOrderId

                return (
                  <TableRow
                    key={id}
                    className="cursor-pointer hover:bg-accent/40"
                    onClick={() => groupId && router.push(`/dashboard/orders/${groupId}`)}
                  >
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="font-mono text-xs font-semibold text-primary">
                          #{id?.slice(-8).toUpperCase()}
                        </span>
                        <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                          {groupId ? `Group ${groupId.slice(-8)}` : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="max-w-[160px] truncate font-semibold">
                          {order.fullName ?? "-"}
                        </span>
                        <span className="max-w-[190px] truncate text-xs text-muted-foreground">
                          {order.emailAddress ?? order.phoneNumber ?? "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {order.restaurant?.name ?? order.items?.[0]?.restaurantName ?? "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(order.finalTotalPrice, locale)}
                      <span className="ms-1 text-xs text-muted-foreground">
                        ({order.totalQuantity})
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                      {order.deliveryMethod ?? "-"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <OrderStatusSelect
                        value={order.status}
                        onChange={(next) => handleStatusChange(order, next)}
                        disabled={updatingId === id}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt, locale)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!groupId}
                        onClick={() => groupId && router.push(`/dashboard/orders/${groupId}`)}
                        className="size-8 rounded-lg"
                        title={t("viewDetails")}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <TablePagination
        page={data?.currentPage ?? page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={(next) => setPage(next)}
        onLimitChange={(next) => {
          setLimit(next)
          setPage(1)
        }}
      />
    </div>
  )
}
