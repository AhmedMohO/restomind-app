import { setRequestLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { getMyOrderById } from "@/features/orders/api"
import type {  ApiOrder } from "@/features/orders/api/type"
import {
  ArrowLeft,
  ArrowRight,
  Store,
  MapPin,
  CreditCard,
  FileText,
  Truck,
  XCircle,
  Tag,
  AlertCircle,
  ShoppingBag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusMeta, STATUS_ORDER } from "@/features/orders/status"

interface OrderDetailsPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const t = await getTranslations("Orders")
  const isRtl = locale === "ar"

  let order: ApiOrder | null = null
  let errorMessage: string | null = null

  try {
    const res = await getMyOrderById(id)
    order = res.data
  } catch (err) {
    console.error("[OrderDetailsPage] Error loading order:", err)
    errorMessage = err instanceof Error ? err.message : t("errorLoadingOrder")
  }

  if (errorMessage || !order) {
    return (
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-rose-50 p-5 dark:bg-rose-950/30">
            <AlertCircle className="size-10 text-rose-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-bold text-[#2B1B15] dark:text-neutral-100">
              {t("errorLoadingOrder")}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {errorMessage}
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#7C4A27] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
          >
            {t("backToOrders")}
          </Link>
        </div>
      </div>
    )
  }

  const statusMeta = getStatusMeta(order.status)
  const currentStatusIdx = STATUS_ORDER.indexOf(order.status)
  const progressPercent =
    currentStatusIdx >= 0
      ? (currentStatusIdx / (STATUS_ORDER.length - 1)) * 100
      : 0

  const formattedDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(order.createdAt))

  const shortId = order._id.slice(-8).toUpperCase()

  const hasDiscount = order.totalDiscount > 0
  const discountPercent =
    hasDiscount && order.totalOriginalPrice > 0
      ? Math.round((order.totalDiscount / order.totalOriginalPrice) * 100)
      : 0

  return (
    <div className="container mx-auto min-h-[75vh] max-w-4xl space-y-6 px-4 py-8">
      {/* Back Button */}
      <Link
        href="/orders"
        className="dark:hover:bg-neutral-850 inline-flex items-center gap-2 rounded-full border border-[#ECE6DB] bg-white px-4 py-2 text-xs font-semibold text-[#2B1B15] shadow-2xs transition-all hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
      >
        {isRtl ? (
          <ArrowRight className="size-4" />
        ) : (
          <ArrowLeft className="size-4" />
        )}
        <span>{t("backToOrders")}</span>
      </Link>

      {/* Header Card: title, status, progress */}
      <div className="space-y-8 overflow-hidden rounded-[28px] border border-[#ECE6DB] bg-white p-6 shadow-xs md:rounded-[36px] md:p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ECE6DB]/70 pb-6 sm:flex-row sm:items-center dark:border-neutral-800/70">
          <div className="space-y-1 text-start">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#2B1B15] md:text-3xl dark:text-neutral-100">
              {t("orderNo")}{" "}
              <span className="font-mono text-xl font-bold md:text-2xl">
                #{shortId}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              {formattedDate}
            </p>
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-2 self-start rounded-full border px-4 py-1.5 text-xs font-bold tracking-wider uppercase shadow-2xs sm:self-auto",
              statusMeta.badgeClass
            )}
          >
            <statusMeta.Icon className="size-4" />
            {t(statusMeta.labelKey)}
          </span>
        </div>

        {order.status !== "Cancelled" ? (
          <div className="relative px-2 py-4">
            <div className="absolute inset-x-8 top-[28px] -z-0 h-1 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <div
              className="absolute top-[28px] z-0 h-1 rounded-full bg-[#529E66] transition-all duration-700 ease-out dark:bg-emerald-500"
              style={{
                [isRtl ? "right" : "left"]: "2rem",
                width: `calc(${progressPercent}% - (${progressPercent}% > 0 ? 0rem : 0rem))`,
                maxWidth: "calc(100% - 4rem)",
              }}
            />
            <div className="relative z-10 flex items-center justify-between">
              {STATUS_ORDER.map((step, idx) => {
                const isCompleted = idx <= currentStatusIdx
                const isCurrent = idx === currentStatusIdx
                const config = getStatusMeta(step)
                const StepIcon = config.Icon

                return (
                  <div
                    key={step}
                    className="group flex flex-col items-center gap-2 text-center"
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full shadow-xs ring-4 ring-white transition-all duration-300 dark:ring-neutral-900",
                        isCompleted
                          ? "bg-[#529E66] text-white"
                          : "border-2 border-neutral-200 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500",
                        isCurrent &&
                          "scale-110 shadow-md ring-4 ring-emerald-500/30"
                      )}
                    >
                      <StepIcon className="size-4 md:size-5" />
                    </div>
                    <span
                      className={cn(
                        "max-w-[85px] text-[11px] leading-tight font-semibold transition-colors md:text-xs",
                        isCurrent
                          ? "font-bold text-[#529E66] dark:text-emerald-400"
                          : isCompleted
                            ? "text-[#2B1B15] dark:text-neutral-200"
                            : "text-muted-foreground"
                      )}
                    >
                      {t(config.labelKey)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
            <XCircle className="size-5 shrink-0" />
            <span className="text-sm font-semibold">
              {t("statusCancelled")}
            </span>
          </div>
        )}
      </div>

      {/* Main Content: 2 cards instead of 6 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Items card, with restaurant as a compact link-out row */}
        <div className="space-y-5 rounded-[28px] border border-[#ECE6DB] bg-white p-6 shadow-xs lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
          {/* Compact restaurant row -> links to its own page instead of duplicating details here */}

          <div className="dark:bg-neutral-850/60 flex items-center gap-3 rounded-2xl border border-[#ECE6DB]/80 bg-[#FAF7F2]/60 p-3.5 dark:border-neutral-800/80">
            <div className="rounded-xl bg-white p-2 text-[#7C4A27] dark:bg-neutral-800 dark:text-[#C2733C]">
              <Store className="size-4.5" />
            </div>
            <div className="text-start">
              <p className="text-sm font-semibold text-[#2B1B15] dark:text-neutral-100">
                {order.restaurantId.name}
              </p>
              {order.restaurantId.phone && (
                <p className="dir-ltr font-mono text-[11px] text-muted-foreground">
                  {order.restaurantId.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[#ECE6DB] pb-4 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-[#FAF2ED] p-2 text-[#7C4A27] dark:bg-neutral-800 dark:text-[#C2733C]">
                <ShoppingBag className="size-5" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                {t("items")} ({order.totalQuantity})
              </h2>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-muted-foreground dark:bg-neutral-800">
              {order.items.length} {t("uniqueTypes")}
            </span>
          </div>

          <div className="space-y-3.5">
            {order.items.map((item, idx) => {
              const origPrice = item.originalPrice ?? item.price ?? 0
              const offPrice = item.offerPrice ?? item.discountedPrice ?? origPrice
              const itemTitle = item.productTitle || item.title || ""
              const itemHasDiscount = offPrice < origPrice && origPrice > 0
              const itemSavings = (origPrice - offPrice) * item.quantity
              const itemDiscountPct = itemHasDiscount
                ? Math.round(((origPrice - offPrice) / origPrice) * 100)
                : 0

              return (
                <div
                  key={`${item.productId}-${idx}`}
                  className="dark:bg-neutral-850/60 dark:hover:bg-neutral-850 flex flex-col justify-between gap-4 rounded-2xl border border-[#ECE6DB]/80 bg-[#FAF7F2]/60 p-4 transition-all hover:bg-[#FAF7F2] sm:flex-row sm:items-center dark:border-neutral-800/80"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#7C4A27] text-xs font-bold text-white shadow-2xs dark:bg-[#C2733C]">
                      {item.quantity}×
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate text-sm font-semibold text-[#2B1B15] dark:text-neutral-100">
                        {itemTitle}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("unitPrice")}: {offPrice.toFixed(2)} EGP
                        {itemHasDiscount && (
                          <span className="ms-1.5 text-neutral-400 line-through">
                            {origPrice.toFixed(2)} EGP
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-1 border-t border-[#ECE6DB] pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 dark:border-neutral-800">
                    <div className="text-start sm:text-end">
                      <span className="font-serif text-base font-bold text-[#2B1B15] dark:text-neutral-100">
                        {(item.lineTotal ?? offPrice * item.quantity).toFixed(2)} EGP
                      </span>
                      {itemHasDiscount && (
                        <div className="text-xs text-neutral-400 line-through">
                          {(origPrice * item.quantity).toFixed(2)} EGP
                        </div>
                      )}
                    </div>
                    {itemHasDiscount && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <Tag className="size-3" />
                        {t("saved")} {itemSavings.toFixed(2)} EGP (
                        {itemDiscountPct}% OFF)
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: single consolidated Order Details card */}
        <div className="divide-y divide-[#ECE6DB] rounded-[28px] border border-[#ECE6DB] bg-white p-6 shadow-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {/* Summary */}
          <div className="space-y-4 pb-5">
            <h3 className="text-start font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
              {t("orderSummary")}
            </h3>

            {hasDiscount && (
              <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-start text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                  <Tag className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("totalSavings")}</span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-serif text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                    {t("youSaved")} {order.totalDiscount.toFixed(2)} EGP
                  </div>
                  <span className="rounded-full bg-[#529E66] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                    {discountPercent}% OFF
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("subtotal")}</span>
                <span className="font-semibold">
                  {order.totalOriginalPrice.toFixed(2)} EGP
                </span>
              </div>

              {hasDiscount && (
                <div className="flex items-center justify-between font-semibold text-[#529E66] dark:text-emerald-400">
                  <span>{t("discount")}</span>
                  <span>− {order.totalDiscount.toFixed(2)} EGP</span>
                </div>
              )}

              <hr className="my-2 border-t border-[#ECE6DB] dark:border-neutral-800" />

              <div className="flex items-baseline justify-between font-serif font-bold text-[#2B1B15] dark:text-neutral-100">
                <span className="text-base">{t("grandTotal")}</span>
                <span className="text-2xl font-extrabold text-[#7C4A27] dark:text-[#C2733C]">
                  {order.finalTotalPrice.toFixed(2)} EGP
                </span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-2 py-5">
            <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
              <Truck className="size-4" />
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t("deliveryMethod")}
              </h4>
            </div>
            <p className="text-start text-sm font-semibold text-[#2B1B15] dark:text-neutral-200">
              {order.deliveryMethod === "Home Delivery"
                ? t("homeDelivery")
                : t("storePickup")}
            </p>
            {order.deliveryAddress && (
              <p className="flex items-start gap-1.5 text-start text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {[
                    order.deliveryAddress.street,
                    order.deliveryAddress.city,
                    order.deliveryAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="space-y-2 py-5">
            <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
              <CreditCard className="size-4" />
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t("paymentMethod")}
              </h4>
            </div>
            <p className="text-start text-sm font-semibold text-[#2B1B15] dark:text-neutral-200">
              {t("cashOnDelivery")}
            </p>
          </div>

          {/* Notes */}
          {order.specialNotes && (
            <div className="space-y-2 pt-5">
              <div className="flex items-center gap-2 text-[#7C4A27] dark:text-[#C2733C]">
                <FileText className="size-4" />
                <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("specialNotes")}
                </h4>
              </div>
              <p className="dark:bg-neutral-850 rounded-2xl border border-[#ECE6DB]/60 bg-[#FAF7F2] p-3.5 text-start text-xs leading-relaxed text-muted-foreground italic dark:border-neutral-800">
                &quot;{order.specialNotes}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
