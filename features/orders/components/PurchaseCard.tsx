"use client"

import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Eye, PackageCheck, Store, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { ApiOrderGroup } from "@/features/orders/api/type"
import { getStatusMeta } from "@/features/orders/status"
import { cn, formatCurrency } from "@/lib/utils"

interface PurchaseCardProps {
  order: ApiOrderGroup
}

export default function PurchaseCard({ order }: PurchaseCardProps) {
  const locale = useLocale()
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
        month: "short",
        day: "numeric",
      }).format(new Date(order.createdAt))
    : ""
  const displayId = order.groupOrderId || ""
  const shortDisplayId = displayId.slice(-8).toUpperCase()
  const hasDiscount = order.totalDiscount > 0
  const discountPercent =
    hasDiscount && order.totalOriginalPrice > 0
      ? Math.round((order.totalDiscount / order.totalOriginalPrice) * 100)
      : 0

  return (
    <Card className="flex flex-col justify-between overflow-hidden rounded-[28px] border-border bg-card p-0 shadow-xs transition-shadow duration-200 hover:shadow-md md:rounded-[32px]">
      <CardHeader className="flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pb-0 md:p-6 md:pb-0">
        <div className="flex min-w-0 items-center gap-3 text-start">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
            <PackageCheck className="size-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-serif text-lg font-bold text-foreground">
                {purchaseTitle}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              #{shortDisplayId} {formattedDate ? `· ${formattedDate}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
              statusMeta.badgeClass
            )}
          >
            <StatusIcon className="size-3.5" />
            <span>{t(statusMeta.labelKey)}</span>
          </Badge>

          <Button
            nativeButton={false}
            render={<Link href={`/orders/${displayId}`} />}
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold"
          >
            <Eye className="me-1 size-3.5" />
            <span>{t("viewDetails")}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 sm:p-5 md:p-6">
        {(order.orders || []).map((restaurantOrder, idx) => {
          const restaurantName =
            restaurantOrder.restaurant?.name || t("restaurant")
          const subStatusMeta = getStatusMeta(restaurantOrder.status)
          const SubStatusIcon = subStatusMeta.Icon

          return (
            <div
              key={`${restaurantOrder.orderId}-${idx}`}
              className="rounded-2xl border border-border bg-muted/40 p-3 sm:p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1 text-start">
                  <div className="flex items-center gap-2">
                    <Store className="size-4 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm font-bold text-foreground">
                      {restaurantName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {restaurantOrder.totalQuantity} {t("items")}
                    </span>
                    {order.orders.length > 1 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 gap-1 rounded-full px-2 text-[10px] font-semibold",
                          subStatusMeta.badgeClass
                        )}
                      >
                        <SubStatusIcon className="size-3" />
                        <span>{t(subStatusMeta.labelKey)}</span>
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                  <span className="font-serif text-lg font-extrabold text-foreground">
                    {formatCurrency(restaurantOrder.finalTotalPrice, locale)}
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
              {formatCurrency(order.finalTotalPrice, locale)}
            </span>
            {hasDiscount && (
              <span className="text-xs font-medium text-muted-foreground line-through">
                {formatCurrency(order.totalOriginalPrice, locale)}
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
                {t("saved")} {formatCurrency(order.totalDiscount, locale)} (
                {discountPercent}% OFF)
              </span>
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
