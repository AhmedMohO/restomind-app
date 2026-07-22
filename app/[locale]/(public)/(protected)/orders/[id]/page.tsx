import { setRequestLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { getMyOrderById } from "@/features/orders/api"
import OrderDetailsPageContent from "@/features/orders/components/OrderDetailsPage"
import type { ApiOrderGroup } from "@/features/orders/api/type"
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react"

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

  let orderGroup: ApiOrderGroup | null = null
  let errorMessage: string | null = null

  try {
    const res = await getMyOrderById(id)
    orderGroup = res.data
  } catch (err) {
    console.error("[OrderDetailsPage] Error loading order group:", err)
    errorMessage = err instanceof Error ? err.message : t("errorLoadingOrder")
  }

  if (errorMessage || !orderGroup || orderGroup.orders.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[75vh] items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-rose-50 p-5 dark:bg-rose-950/30">
            <AlertCircle className="size-10 text-rose-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-bold text-foreground">
              {t("errorLoadingOrder")}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {errorMessage}
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            {t("backToOrders")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto min-h-[75vh] space-y-6 px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-accent hover:text-accent-foreground"
      >
        {isRtl ? (
          <ArrowRight className="size-4" />
        ) : (
          <ArrowLeft className="size-4" />
        )}
        <span>{t("backToOrders")}</span>
      </Link>

      <OrderDetailsPageContent orderGroup={orderGroup} locale={locale} />
    </div>
  )
}
