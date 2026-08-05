import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { AlertTriangle, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { daysUntil, type MySubscription } from "../api/type"

/**
 * The in-dashboard subscription notice.
 *
 * Trial renders as a quiet countdown that only turns amber in the final three
 * days — the merchant is evaluating, and a wall of warnings during evaluation
 * sells nothing. Grace renders as a real banner, because at that point money
 * is genuinely overdue.
 */
export default async function SubscriptionBanner({
  subscription,
  locale,
}: {
  subscription: MySubscription
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: "billing" })

  if (subscription.state === "trial") {
    const days = daysUntil(subscription.trialEndsAt)
    if (days === null) return null
    const urgent = days <= 3

    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-2 text-sm",
          urgent
            ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            : "bg-muted/40 text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden />
          {days <= 0
            ? t("trialEndsToday")
            : t("trialCountdown", { days })}
        </span>
        <Link
          href={`/${locale}/dashboard/billing`}
          className="font-medium underline underline-offset-4"
        >
          {t("choosePlan")}
        </Link>
      </div>
    )
  }

  if (subscription.state === "grace") {
    const days = daysUntil(subscription.currentPeriodEnd)
    const graceLeft = days === null ? 0 : Math.max(0, 7 + days)

    return (
      <div
        role="status"
        className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {t("graceWarning", { days: graceLeft })}
        </span>
        <Link
          href={`/${locale}/dashboard/billing`}
          className="font-medium underline underline-offset-4"
        >
          {t("payNow")}
        </Link>
      </div>
    )
  }

  return null
}
