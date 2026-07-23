"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Truck, Store, PackageCheck } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import type { FulfillmentMethodItem } from "../types"

interface FulfillmentMethodCardProps {
  methods?: FulfillmentMethodItem[]
  isLoading?: boolean
}

export function FulfillmentMethodCard({
  methods = [],
  isLoading = false,
}: FulfillmentMethodCardProps) {
  const t = useTranslations("Dashboard.analytics")
  const locale = useLocale()
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US"
  const formatNumber = (val: number) =>
    new Intl.NumberFormat(numberLocale).format(val)

  if (isLoading) {
    return (
      <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  // Match backend formats: "home_delivery", "Home Delivery", "delivery" vs "store_pickup", "Store Pickup", "pickup"
  const deliveryItem = methods.find(
    (m) =>
      m.type === "delivery" ||
      m.id === "home_delivery" ||
      m.type?.toLowerCase().includes("home") ||
      m.name?.toLowerCase().includes("home")
  )
  const pickupItem = methods.find(
    (m) =>
      m.type === "pickup" ||
      m.id === "store_pickup" ||
      m.type?.toLowerCase().includes("store") ||
      m.name?.toLowerCase().includes("store")
  )

  const deliveryCount = deliveryItem ? deliveryItem.count : 0
  const deliveryPercent = deliveryItem ? deliveryItem.percentage : 0

  const pickupCount = pickupItem ? pickupItem.count : 0
  const pickupPercent = pickupItem ? pickupItem.percentage : 0

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <PackageCheck className="size-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              {t("fulfillmentTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t("fulfillmentSub")}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-1 flex-col justify-center space-y-4">
        {methods.length > 0 ? (
          <div className="space-y-3 w-full">
            {/* Home Delivery Row */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Truck className="size-4" />
                  </div>
                  <span>{t("homeDelivery")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    {formatNumber(deliveryCount)} {t("kpiOrders")}
                  </span>
                  <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(deliveryPercent)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${deliveryPercent}%`,
                  }}
                />
              </div>
            </div>

            {/* Store Pickup Row */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Store className="size-4" />
                  </div>
                  <span>{t("storePickup")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    {formatNumber(pickupCount)} {t("kpiOrders")}
                  </span>
                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {formatNumber(pickupPercent)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${pickupPercent}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
            <p>{t("noFulfillmentData")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


