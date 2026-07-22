"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Eye, PackageCheck, Store, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { ApiOrderGroup } from "@/features/orders/api/type"
import { getStatusMeta } from "@/features/orders/status"
import { cn } from "@/lib/utils"

interface PurchaseCardProps {
  order: ApiOrderGroup
}

export default function PurchaseCard({ order }: PurchaseCardProps) {
  const t = useTranslations("Orders")
  const statusMeta = getStatusMeta(order.overallStatus)
  const StatusIcon = statusMeta.Icon
  const restaurantNames = (order.orders || []).map(
    (item) => item.restaurant?.name || t("restaurant")
  )
  const purchaseTitle =
    restaurantNames.length > 2
      ? `${restaurantNames.slice(0, 2).join(", ")} +${restaurantNames.length - 2}`
      : restaurantNames.join(", ")
  const formattedDate = order.createdAt
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(order.createdAt))
    : ""
  const shortGroupId = (order.orderGroupId || "").slice(-8).toUpperCase()
  const hasDiscount = order.totalDiscount > 0
  const discountPercent =
    hasDiscount && order.totalOriginalPrice > 0
      ? Math.round((order.totalDiscount / order.totalOriginalPrice) * 100)
      : 0

  return (
    <Card className="overflow-hidden rounded-[24px] border-border bg-card shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm md:rounded-[28px]">
      <CardHeader className="border-b border-border p-4 pb-3 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 text-start">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-primary">
              <PackageCheck className="size-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-bold text-foreground">
                  {purchaseTitle || t("restaurant")}
                </h3>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  #{shortGroupId}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {formattedDate} · {order.totalQuantity} {t("items")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 px-3 py-1 text-xs font-bold",
                statusMeta.badgeClass
              )}
            >
              <StatusIcon className="size-3.5" />
              <span>{t(statusMeta.labelKey)}</span>
            </Badge>
            <Button
              nativeButton={false}
              render={<Link href={`/orders/${order.orderGroupId}`} />}
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full border-border text-xs font-semibold text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Eye className="me-1 size-3.5" />
              <span>{t("viewDetails")}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 md:p-5">
        {order.orders.map((restaurantOrder) => {
          const meta = getStatusMeta(restaurantOrder.status)
          const RestaurantStatusIcon = meta.Icon
          const shortOrderId = restaurantOrder.orderId.slice(-8).toUpperCase()
          const visibleItems = restaurantOrder.items.slice(0, 3)
          const remainingCount =
            restaurantOrder.items.length - visibleItems.length

          return (
            <div
              key={restaurantOrder.orderId}
              className="rounded-2xl border border-border bg-muted/40 p-3.5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2 text-start">
                  <div className="flex flex-wrap items-center gap-2">
                    <Store className="size-4 shrink-0 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      {restaurantOrder.restaurant.name}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                      #{shortOrderId}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 px-2 py-0.5 text-[11px] font-bold",
                        meta.badgeClass
                      )}
                    >
                      <RestaurantStatusIcon className="size-3" />
                      <span>{t(meta.labelKey)}</span>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {visibleItems.map((item) => (
                      <Badge
                        key={item.offerId}
                        variant="secondary"
                        className="max-w-[220px] truncate rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        <span className="me-1 font-bold text-primary">
                          {item.quantity}×
                        </span>
                        <span className="truncate">{item.productTitle}</span>
                      </Badge>
                    ))}
                    {remainingCount > 0 && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                      >
                        +{remainingCount} {t("more")}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                  <span className="font-serif text-lg font-extrabold text-foreground">
                    {restaurantOrder.finalTotalPrice.toFixed(2)} EGP
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border p-4 pt-3 sm:flex-row sm:items-center sm:justify-between md:p-5">
        <div className="space-y-1 self-stretch text-start sm:self-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-lg font-extrabold text-foreground md:text-xl">
              {order.finalTotalPrice.toFixed(2)} EGP
            </span>
            {hasDiscount && (
              <span className="text-xs font-medium text-muted-foreground line-through">
                {order.totalOriginalPrice.toFixed(2)} EGP
              </span>
            )}
          </div>

          {hasDiscount && (
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
            >
              <Tag className="size-3" />
              <span>
                {t("saved")} {order.totalDiscount.toFixed(2)} EGP (
                {discountPercent}% OFF)
              </span>
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
