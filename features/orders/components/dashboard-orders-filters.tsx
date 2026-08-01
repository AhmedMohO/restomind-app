"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowUpDown,
  Calendar,
  CreditCard,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Store,
  Tag,
  Truck,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"
import { ORDER_STATUS_OPTIONS } from "@/features/orders/components/order-status-select"
import { getStatusMeta } from "@/features/orders/status"
import type { OrderStatus } from "@/features/orders/api/type"
import { formatCurrency } from "@/lib/utils"

const ALL = "all"
export const TOTAL_PRICE_MIN = 0
export const TOTAL_PRICE_MAX = 5000

const DELIVERY_METHOD_OPTIONS = ["Home Delivery", "Store Pickup"] as const
const PAYMENT_METHOD_OPTIONS = [
  "Cash on Delivery",
  "Credit / Debit Card",
] as const

export interface OrderFilters {
  status: OrderStatus | ""
  paymentMethod: string
  deliveryMethod: string
  startDate: string
  endDate: string
  restaurantId: string
  totalPriceRange: [number, number]
  sortOrder: "asc" | "desc"
}

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  status: "",
  paymentMethod: "",
  deliveryMethod: "",
  startDate: "",
  endDate: "",
  restaurantId: "",
  totalPriceRange: [TOTAL_PRICE_MIN, TOTAL_PRICE_MAX],
  sortOrder: "desc",
}

/** Number of filters differing from their default — drives the trigger badge. */
export function countActiveFilters(filters: OrderFilters): number {
  return (Object.keys(DEFAULT_ORDER_FILTERS) as (keyof OrderFilters)[]).filter(
    (key) =>
      JSON.stringify(filters[key]) !==
      JSON.stringify(DEFAULT_ORDER_FILTERS[key])
  ).length
}

interface DashboardOrdersFiltersProps {
  filters: OrderFilters
  onChange: <K extends keyof OrderFilters>(
    key: K,
    value: OrderFilters[K]
  ) => void
  onReset: () => void
  /** Restaurant scoping is admin-only — managers and staff are already pinned. */
  showRestaurantFilter: boolean
}

/** Section shell shared by every group of filters inside the sheet. */
function FilterSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs ${className ?? ""}`}
    >
      {children}
    </div>
  )
}

export function DashboardOrdersFilters({
  filters,
  onChange,
  onReset,
  showRestaurantFilter,
}: DashboardOrdersFiltersProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.orders")
  const tOrders = useTranslations("Orders")
  const activeFilterCount = countActiveFilters(filters)

  const updateTotalPriceRange = (next: [number, number]) => {
    const min = Math.max(TOTAL_PRICE_MIN, Math.min(next[0], TOTAL_PRICE_MAX))
    const max = Math.max(min, Math.min(next[1], TOTAL_PRICE_MAX))
    onChange("totalPriceRange", [min, max])
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" className="!w-auto w-full gap-2 rounded-xl">
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
        side={locale === "ar" ? "left" : "right"}
        className="flex h-full w-full max-w-md flex-col overflow-hidden p-0 sm:max-w-md"
      >
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

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Status & sort order */}
          <FilterSection>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="order-status-filter" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Tag className="size-3.5 text-primary" />
                    <span>{t("statusFilter")}</span>
                  </Label>
                  {filters.status && (
                    <button
                      type="button"
                      onClick={() => onChange("status", "")}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      {t("resetFilters")}
                    </button>
                  )}
                </div>
                <Select
                  value={filters.status || ALL}
                  onValueChange={(value) =>
                    onChange(
                      "status",
                      value === ALL ? "" : (value as OrderStatus)
                    )
                  }
                >
                  <SelectTrigger id="order-status-filter" className="h-9 w-full rounded-xl border-input bg-background text-xs">
                    <SelectValue>
                      {filters.status ? (
                        <span className="inline-flex items-center gap-2 font-medium">
                          {React.createElement(
                            getStatusMeta(filters.status).Icon,
                            {
                              className: "size-3.5 text-primary",
                            }
                          )}
                          <span>
                            {tOrders(getStatusMeta(filters.status).labelKey)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("allStatuses")}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>
                      <span className="font-medium text-foreground">
                        {t("allStatuses")}
                      </span>
                    </SelectItem>
                    {ORDER_STATUS_OPTIONS.map((option) => {
                      const meta = getStatusMeta(option)
                      return (
                        <SelectItem key={option} value={option}>
                          <span className="inline-flex items-center gap-2">
                            <meta.Icon className="size-3.5 text-muted-foreground" />
                            <span>{tOrders(meta.labelKey)}</span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-sort-filter" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ArrowUpDown className="size-3.5 text-primary" />
                  <span>{t("sortOrder")}</span>
                </Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) =>
                    onChange("sortOrder", value as "asc" | "desc")
                  }
                >
                  <SelectTrigger id="order-sort-filter" className="h-9 w-full rounded-xl border-input bg-background text-xs">
                    <SelectValue>
                      <span className="inline-flex items-center gap-2 font-medium">
                        <ArrowUpDown className="size-3.5 text-primary" />
                        <span>
                          {filters.sortOrder === "desc"
                            ? t("newestFirst")
                            : t("oldestFirst")}
                        </span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{t("newestFirst")}</SelectItem>
                    <SelectItem value="asc">{t("oldestFirst")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FilterSection>

          {/* Restaurant (admin only) */}
          {showRestaurantFilter && (
            <FilterSection className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="order-restaurant-filter" className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Store className="size-3.5 text-primary" />
                  <span>{t("restaurant")}</span>
                </Label>
                {filters.restaurantId && (
                  <button
                    type="button"
                    onClick={() => onChange("restaurantId", "")}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    {t("resetFilters")}
                  </button>
                )}
              </div>
              <PaginatedRestaurantSelect
                id="order-restaurant-filter"
                value={filters.restaurantId}
                onValueChange={(value) => onChange("restaurantId", value)}
              />
            </FilterSection>
          )}

          {/* Fulfilment & payment */}
          <FilterSection className="space-y-3.5">
            <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Truck className="size-3.5 text-primary" />
              <span>{t("fulfillment")}</span>
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="order-delivery-filter" className="text-[11px] font-medium text-muted-foreground">
                  {t("deliveryMethod")}
                </Label>
                <Select
                  value={filters.deliveryMethod || ALL}
                  onValueChange={(value) =>
                    onChange(
                      "deliveryMethod",
                      !value || value === ALL ? "" : value
                    )
                  }
                >
                  <SelectTrigger id="order-delivery-filter" className="h-9 w-full rounded-xl border-input bg-background text-xs">
                    <SelectValue>
                      {filters.deliveryMethod ? (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {filters.deliveryMethod === "Home Delivery" ? (
                            <Truck className="size-3.5 text-primary" />
                          ) : (
                            <Store className="size-3.5 text-primary" />
                          )}
                          <span>
                            {filters.deliveryMethod === "Home Delivery"
                              ? t("homeDelivery")
                              : t("storePickup")}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("allDeliveryMethods")}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>
                      <span className="font-medium text-foreground">
                        {t("allDeliveryMethods")}
                      </span>
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
                            {option === "Home Delivery"
                              ? t("homeDelivery")
                              : t("storePickup")}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-payment-filter" className="text-[11px] font-medium text-muted-foreground">
                  {t("paymentMethod")}
                </Label>
                <Select
                  value={filters.paymentMethod || ALL}
                  onValueChange={(value) =>
                    onChange(
                      "paymentMethod",
                      !value || value === ALL ? "" : value
                    )
                  }
                >
                  <SelectTrigger id="order-payment-filter" className="h-9 w-full rounded-xl border-input bg-background text-xs">
                    <SelectValue>
                      {filters.paymentMethod ? (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {filters.paymentMethod === "Cash on Delivery" ? (
                            <Wallet className="size-3.5 text-primary" />
                          ) : (
                            <CreditCard className="size-3.5 text-primary" />
                          )}
                          <span>
                            {filters.paymentMethod === "Cash on Delivery"
                              ? t("cashOnDelivery")
                              : t("creditDebitCard")}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("allPaymentMethods")}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>
                      <span className="font-medium text-foreground">
                        {t("allPaymentMethods")}
                      </span>
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
          </FilterSection>

          {/* Date range */}
          <FilterSection>
            <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Calendar className="size-3.5 text-primary" />
              <span>
                {t("startDate")} / {t("endDate")}
              </span>
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="order-start-date-filter" className="text-[11px] font-medium text-muted-foreground">
                  {t("startDate")}
                </Label>
                <DatePicker
                  value={filters.startDate}
                  onChange={(value) => onChange("startDate", value ?? "")}
                  placeholder={t("startDate")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order-end-date-filter" className="text-[11px] font-medium text-muted-foreground">
                  {t("endDate")}
                </Label>
                <DatePicker
                  value={filters.endDate}
                  onChange={(value) => onChange("endDate", value ?? "")}
                  placeholder={t("endDate")}
                />
              </div>
            </div>
          </FilterSection>

          {/* Price range */}
          <FilterSection className="space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Wallet className="size-3.5 text-primary" />
                <span>{t("totalPriceRange")}</span>
              </Label>
              <Badge
                variant="secondary"
                className="px-2.5 py-1 text-[11px] font-semibold text-primary"
              >
                <span
                  className={`inline-flex items-center gap-1 ${
                    locale === "ar" ? "font-sans" : "font-mono"
                  }`}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  <span>
                    {formatCurrency(filters.totalPriceRange[0], locale)}
                  </span>
                  <span>–</span>
                  <span>
                    {formatCurrency(filters.totalPriceRange[1], locale)}
                  </span>
                </span>
              </Badge>
            </div>
            <div dir="ltr" className="space-y-3.5">
              <Slider
                dir="ltr"
                min={TOTAL_PRICE_MIN}
                max={TOTAL_PRICE_MAX}
                step={5}
                value={filters.totalPriceRange}
                onValueChange={(value) =>
                  updateTotalPriceRange(value as [number, number])
                }
                className="py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-center">
                  <Label htmlFor="order-min-price-filter" className="text-[11px] font-medium text-muted-foreground">
                    {t("minTotal")}
                  </Label>
                  <Input
                    id="order-min-price-filter"
                    type="number"
                    min={TOTAL_PRICE_MIN}
                    max={filters.totalPriceRange[1]}
                    value={filters.totalPriceRange[0]}
                    onChange={(e) =>
                      updateTotalPriceRange([
                        Number(e.target.value || TOTAL_PRICE_MIN),
                        filters.totalPriceRange[1],
                      ])
                    }
                    className="h-8 rounded-xl text-center text-xs"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <Label htmlFor="order-max-price-filter" className="text-[11px] font-medium text-muted-foreground">
                    {t("maxTotal")}
                  </Label>
                  <Input
                    id="order-max-price-filter"
                    type="number"
                    min={filters.totalPriceRange[0]}
                    max={TOTAL_PRICE_MAX}
                    value={filters.totalPriceRange[1]}
                    onChange={(e) =>
                      updateTotalPriceRange([
                        filters.totalPriceRange[0],
                        Number(e.target.value || TOTAL_PRICE_MAX),
                      ])
                    }
                    className="h-8 rounded-xl text-center text-xs"
                  />
                </div>
              </div>
            </div>
          </FilterSection>
        </div>

        <SheetFooter className="border-t border-border bg-card/60 p-4 backdrop-blur-xs">
          <Button
            variant="outline"
            onClick={onReset}
            className="w-full gap-2 rounded-xl text-xs font-medium"
          >
            <RotateCcw className="size-3.5" />
            <span>{t("resetFilters")}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
