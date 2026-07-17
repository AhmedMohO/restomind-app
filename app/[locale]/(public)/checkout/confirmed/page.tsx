import { useTranslations } from "next-intl"
import { CheckCircle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function OrderConfirmedPage() {
  const t = useTranslations("OrderConfirmed")

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center gap-6">
      {/* Green circle */}
      <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle className="size-10 text-primary" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground max-w-sm">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground/70">{t("sms")}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "default" }),
            "rounded-full px-8 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          )}
        >
          {t("trackOrder")}
        </Link>
        <Link
          href="/offers"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full px-8 h-11 font-semibold"
          )}
        >
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  )
}
