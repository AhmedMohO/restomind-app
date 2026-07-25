import { PackageCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ApiOrderGroup } from "@/features/orders/api/type"
import { getStatusMeta } from "@/features/orders/status"
import { cn } from "@/lib/utils"

interface OrderHeaderProps {
  orderGroup: ApiOrderGroup
  formattedDate: string
  t: (key: string) => string
}

export default function OrderHeader({
  orderGroup,
  formattedDate,
  t,
}: OrderHeaderProps) {
  const statusMeta = getStatusMeta(orderGroup.overallStatus)
  const StatusIcon = statusMeta.Icon
  const shortDisplayId = orderGroup.orderGroupId.slice(-8).toUpperCase()
  const hasDiscount = orderGroup.totalDiscount > 0
  const discountPercent =
    hasDiscount && orderGroup.totalOriginalPrice > 0
      ? Math.round(
          (orderGroup.totalDiscount / orderGroup.totalOriginalPrice) * 100
        )
      : 0

  return (
    <Card className="rounded-[28px] border-border bg-card p-0 shadow-xs md:rounded-[32px]">
      <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center md:p-6">
        <div className="flex min-w-0 items-center gap-3 text-start">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
            <PackageCheck className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="truncate font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {t("orderNo")} #{shortDisplayId}
              </h1>
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
            </div>
            <p className="text-xs text-muted-foreground md:text-sm">
              {formattedDate ? `${formattedDate} · ` : ""}
              {orderGroup.totalQuantity} {t("items")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-start sm:text-end">
          <div className="font-serif text-2xl font-extrabold text-primary">
            {orderGroup.finalTotalPrice.toFixed(2)} EGP
          </div>
          {hasDiscount && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t("saved")} {orderGroup.totalDiscount.toFixed(2)} EGP (
              {discountPercent}% OFF)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
