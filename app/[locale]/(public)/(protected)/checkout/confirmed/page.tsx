import { setRequestLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { CheckCircle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getAlternates } from "@/lib/seo/metadata"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "Order Confirmed",
    alternates: getAlternates(locale, "/checkout/confirmed"),
    robots: { index: false, follow: false },
  }
}

export default async function OrderConfirmedPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("OrderConfirmed")

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle className="size-10 text-primary" strokeWidth={1.5} />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
        <p className="text-xs text-muted-foreground/70">{t("sms")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/orders"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-11 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90"
          )}
        >
          {t("trackOrder")}
        </Link>
        <Link
          href="/offers"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 rounded-full px-8 font-semibold"
          )}
        >
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  )
}
