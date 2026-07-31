import type { ReactNode } from "react"
import { Store } from "lucide-react"
import { useLocale } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type {
  ApiChildOrder,
  ApiChildOrderItem,
  ApiGroupSubOrder,
  ApiOrderItem,
} from "@/features/orders/api/type"
import { getStatusMeta } from "@/features/orders/status"
import { cn, formatCurrency } from "@/lib/utils"

interface RestaurantOrderCardProps {
  order: ApiGroupSubOrder | ApiChildOrder
  t: (key: string) => string
  className?: string
  /**
   * Replaces the read-only status badge — the dashboard passes a status select
   * so admins, managers and staff can advance the order from the same card.
   */
  statusSlot?: ReactNode
}

interface OrderItemRowProps {
  item: ApiOrderItem | ApiChildOrderItem
  t: (key: string) => string
}

function OrderItemRow({ item, t }: OrderItemRowProps) {
  const locale = useLocale()
  const title = "productTitle" in item && item.productTitle ? item.productTitle : ("title" in item ? item.title : "")
  const price = "originalPrice" in item ? item.originalPrice : item.price
  const discountedPrice = "offerPrice" in item ? item.offerPrice : item.discountedPrice
  const itemHasDiscount = discountedPrice < price

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-2xs">
          {item.quantity}x
        </span>
        <div className="min-w-0 space-y-1 text-start">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("unitPrice")}: {formatCurrency(discountedPrice, locale)}
            {itemHasDiscount && (
              <span className="ms-1.5 text-muted-foreground/70 line-through">
                {formatCurrency(price, locale)}
              </span>
            )}
          </p>
        </div>
      </div>

      <span className="shrink-0 text-start font-serif text-base font-bold text-foreground sm:text-end">
        {formatCurrency(item.lineTotal, locale)}
      </span>
    </div>
  )
}

export default function RestaurantOrderCard({
  order,
  t,
  className,
  statusSlot,
}: RestaurantOrderCardProps) {
  const locale = useLocale()
  const statusMeta = getStatusMeta(order.status)

  const restaurantName = order.restaurant.name
  const rawId = "orderId" in order ? order.orderId : order._id
  const shortOrderId = (rawId || "").slice(-8).toUpperCase()
  const hasDiscount = order.totalDiscount > 0


  return (
    <Card
      className={cn(
        "rounded-[28px] border-border bg-card p-0 shadow-xs md:rounded-[32px]",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pb-0 md:p-6 md:pb-0">
        <div className="flex min-w-0 items-center gap-3 text-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/60 text-primary">
            <Store className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg font-bold text-foreground">
              {restaurantName}
            </h2>
            <p className="font-mono text-xs font-semibold text-muted-foreground">
              #{shortOrderId}
            </p>
          </div>
        </div>

        {statusSlot ?? (
          <Badge
            variant="outline"
            className={cn(
              "h-6 gap-1.5 rounded-full px-3 text-xs font-bold",
              statusMeta.badgeClass
            )}
          >
            <statusMeta.Icon className="size-3.5" />
            <span>{t(statusMeta.labelKey)}</span>
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5 md:p-6">
        <Separator className="bg-border" />

        <div className="space-y-3" aria-label={t("items")}>
          {order.items.map((item, idx) => (
            <OrderItemRow key={`${item.offerId}-${idx}`} item={item} t={t} />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 text-muted-foreground">
              <span>{t("subtotal")}</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(order.totalOriginalPrice, locale)}
              </span>
            </div>
            {hasDiscount && (
              <div className="flex items-center justify-between gap-3 font-semibold text-emerald-600 dark:text-emerald-400">
                <span>{t("discount")}</span>
                <span>- {formatCurrency(order.totalDiscount, locale)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3 font-serif font-bold text-foreground">
              <span>{t("grandTotal")}</span>
              <span className="text-xl font-extrabold text-primary">
                {formatCurrency(order.finalTotalPrice, locale)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

