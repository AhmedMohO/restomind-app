import {
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  Store,
  Truck,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type {
  ApiOrderGroup,
  ApiRestaurantOrder,
} from "@/features/orders/api/type"
import { getStatusMeta } from "@/features/orders/status"
import { cn } from "@/lib/utils"

interface OrderDetailsPanelProps {
  order: ApiRestaurantOrder
  orderGroup: ApiOrderGroup
  t: (key: string) => string
  className?: string
}

export default function OrderDetailsPanel({
  order,
  orderGroup,
  t,
  className,
}: OrderDetailsPanelProps) {
  const statusMeta = getStatusMeta(order.status)
  const restaurantName = order.restaurant.name
  const shortOrderId = order.orderId.slice(-8).toUpperCase()
  const hasDiscount = order.totalDiscount > 0

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[28px] border-[#ECE6DB] bg-white p-0 shadow-xs md:rounded-[32px] dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
    >
      <CardContent className="grid min-w-0 gap-5 p-4 sm:p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 text-start">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#ECE6DB]/70 bg-[#FAF2ED] text-[#7C4A27] dark:border-neutral-800 dark:bg-neutral-800 dark:text-[#C2733C]">
                <Store className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                  {restaurantName}
                </h2>
                <p className="font-mono text-xs font-semibold text-[#8C7060] dark:text-neutral-400">
                  #{shortOrderId}
                </p>
              </div>
            </div>

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
          </div>

          <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />

          <div className="space-y-3" aria-label={t("items")}>
            {order.items.map((item, idx) => {
              const itemHasDiscount = item.offerPrice < item.originalPrice

              return (
                <div
                  key={`${item.offerId}-${idx}`}
                  className="dark:bg-neutral-850/60 flex min-w-0 flex-col gap-4 rounded-2xl border border-[#ECE6DB]/80 bg-[#FAF7F2]/70 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4 dark:border-neutral-800/80"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#7C4A27] text-xs font-bold text-white shadow-2xs dark:bg-[#C2733C]">
                      {item.quantity}x
                    </span>
                    <div className="min-w-0 space-y-1 text-start">
                      <h3 className="truncate text-sm font-semibold text-[#2B1B15] dark:text-neutral-100">
                        {item.productTitle}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("unitPrice")}: {item.offerPrice.toFixed(2)} EGP
                        {itemHasDiscount && (
                          <span className="ms-1.5 text-neutral-400 line-through">
                            {item.originalPrice.toFixed(2)} EGP
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-start font-serif text-base font-bold text-[#2B1B15] sm:text-end dark:text-neutral-100">
                    {item.lineTotal.toFixed(2)} EGP
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="min-w-0 rounded-[24px] border border-[#ECE6DB] bg-white/55 p-4 sm:p-5 lg:self-start dark:border-neutral-800 dark:bg-neutral-900/55">
          <div className="space-y-5">
            <section className="space-y-3 text-sm">
              <h3 className="text-start font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                {t("orderSummary")}
              </h3>
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span>{t("subtotal")}</span>
                <span className="font-semibold">
                  {order.totalOriginalPrice.toFixed(2)} EGP
                </span>
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between gap-3 font-semibold text-[#529E66] dark:text-emerald-400">
                  <span>{t("discount")}</span>
                  <span>- {order.totalDiscount.toFixed(2)} EGP</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 font-serif font-bold text-[#2B1B15] dark:text-neutral-100">
                <span>{t("grandTotal")}</span>
                <span className="text-xl font-extrabold text-[#7C4A27] dark:text-[#C2733C]">
                  {order.finalTotalPrice.toFixed(2)} EGP
                </span>
              </div>
            </section>

            <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
                <User className="size-4" />
                <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("customer")}
                </h4>
              </div>
              <div className="space-y-1.5 text-start text-xs text-muted-foreground">
                <p className="font-semibold text-[#2B1B15] dark:text-neutral-200">
                  {orderGroup.fullName}
                </p>
                <p className="flex min-w-0 items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" />
                  <span className="break-words">{orderGroup.phoneNumber}</span>
                </p>
                <p className="flex min-w-0 items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="break-words">{orderGroup.emailAddress}</span>
                </p>
              </div>
            </section>

            <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
                <Truck className="size-4" />
                <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("deliveryMethod")}
                </h4>
              </div>
              <p className="text-start text-sm font-semibold text-[#2B1B15] dark:text-neutral-200">
                {orderGroup.deliveryMethod === "Home Delivery"
                  ? t("homeDelivery")
                  : t("storePickup")}
              </p>
              {orderGroup.deliveryAddress && (
                <p className="flex items-start gap-1.5 text-start text-xs leading-relaxed text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="min-w-0 break-words">
                    {[
                      orderGroup.deliveryAddress.street,
                      orderGroup.deliveryAddress.city,
                      orderGroup.deliveryAddress.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
              )}
            </section>

            <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
                <CreditCard className="size-4" />
                <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("paymentMethod")}
                </h4>
              </div>
              <p className="text-start text-sm font-semibold text-[#2B1B15] dark:text-neutral-200">
                {orderGroup.paymentMethod === "Cash on Delivery"
                  ? t("cashOnDelivery")
                  : orderGroup.paymentMethod}
              </p>
            </section>

            {orderGroup.specialNotes && (
              <>
                <Separator className="bg-[#ECE6DB] dark:bg-neutral-800" />
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
                    <FileText className="size-4" />
                    <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      {t("specialNotes")}
                    </h4>
                  </div>
                  <p className="dark:bg-neutral-850 rounded-2xl border border-[#ECE6DB]/60 bg-[#FAF7F2] p-3.5 text-start text-xs leading-relaxed text-muted-foreground italic dark:border-neutral-800">
                    &quot;{orderGroup.specialNotes}&quot;
                  </p>
                </section>
              </>
            )}
          </div>
        </aside>
      </CardContent>
    </Card>
  )
}
