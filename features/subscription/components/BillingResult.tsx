"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  ArrowRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "@/i18n/routing"
import {
  reconcilePaymentAction,
  type PaymentStatus,
} from "@/features/payments/actions"

export interface BillingResultProps {
  success?: string
  pending?: string
  errorOccured?: string
  id?: string
  order?: string
  merchantOrderId?: string
  amountCents?: string
  currency?: string
  message?: string
  pan?: string
  subType?: string
  txnResponseCode?: string
}

export default function BillingResult({
  success,
  pending,
  errorOccured,
  id,
  order,
  merchantOrderId,
  amountCents,
  currency = "EGP",
  message,
  pan,
  subType,
  txnResponseCode,
}: BillingResultProps) {
  const t = useTranslations("Dashboard.billing.result")
  const router = useRouter()

  // The redirect's own success flags are only a first guess: they are not
  // authenticated, and anyone can retype the URL. They decide what to render
  // for the instant before the server answers, and nothing after that.
  const [verified, setVerified] = useState<PaymentStatus | null>(null)

  const claimsSuccess =
    success === "true" && pending !== "true" && errorOccured !== "true"
  const claimsPending = pending === "true"

  const isSuccess = verified ? verified === "paid" : claimsSuccess
  const isPending = verified ? verified === "pending" : claimsPending
  const isFailed = !isSuccess && !isPending

  useEffect(() => {
    // Settle the payment now instead of waiting on a callback that may be
    // slow — or, against a local API, will never arrive. Until this lands the
    // dashboard stays locked no matter what the redirect claims, which is
    // exactly the "I paid and it still wants me to pay" complaint.
    let cancelled = false
    void reconcilePaymentAction(order ?? null).then((status) => {
      if (cancelled) return
      if (status) setVerified(status)
      // Re-render the dashboard shell so the paywall lifts without a manual
      // reload once the subscription is actually active.
      if (status === "paid") router.refresh()
    })
    return () => {
      cancelled = true
    }
  }, [order, router])

  // Parse amount in EGP
  const amountNumber = amountCents ? parseInt(amountCents, 10) / 100 : null
  const formattedAmount = amountNumber
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amountNumber)
    : null

  const paymentCardInfo =
    pan && subType
      ? t("cardEnding", { type: subType, pan })
      : subType || pan || t("paymentMethod")

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-12">
      <Card className="w-full overflow-hidden rounded-2xl border bg-card shadow-lg transition-all">
        {/* Status Header */}
        <div
          className={`flex flex-col items-center justify-center p-8 text-center ${
            isSuccess
              ? "border-b border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-950/30"
              : isPending
                ? "border-b border-amber-500/20 bg-amber-500/10 dark:bg-amber-950/30"
                : "border-b border-destructive/20 bg-destructive/10 dark:bg-destructive/20"
          }`}
        >
          {isSuccess && (
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-10" />
            </div>
          )}

          {isPending && (
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="size-10 animate-pulse" />
            </div>
          )}

          {isFailed && (
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/20 text-destructive">
              <XCircle className="size-10" />
            </div>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isSuccess
              ? t("successTitle")
              : isPending
                ? t("pendingTitle")
                : t("failedTitle")}
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {isSuccess
              ? t("successBody")
              : isPending
                ? t("pendingBody")
                : message || t("failedBody")}
          </p>

          <Badge
            variant={
              isSuccess ? "default" : isPending ? "secondary" : "destructive"
            }
            className={`mt-4 px-3 py-1 text-xs font-semibold tracking-wider uppercase ${
              isSuccess ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
            }`}
          >
            {isSuccess
              ? t("approved")
              : isPending
                ? t("pending")
                : txnResponseCode || t("declined")}
          </Badge>
        </div>

        {/* Transaction Details */}
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
            {formattedAmount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("amountPaid")}</span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {formattedAmount}
                </span>
              </div>
            )}

            {id && (
              <div className="flex items-center justify-between border-t pt-2.5 text-sm">
                <span className="text-muted-foreground">
                  {t("transactionId")}
                </span>
                <span className="font-mono text-xs text-foreground">{id}</span>
              </div>
            )}

            {(merchantOrderId || order) && (
              <div className="flex items-center justify-between border-t pt-2.5 text-sm">
                <span className="text-muted-foreground">{t("orderId")}</span>
                <span className="max-w-[200px] truncate font-mono text-xs text-foreground">
                  {merchantOrderId || order}
                </span>
              </div>
            )}

            {(pan || subType) && (
              <div className="flex items-center justify-between border-t pt-2.5 text-sm">
                <span className="text-muted-foreground">
                  {t("paymentMethod")}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <CreditCard className="size-3.5" />
                  {paymentCardInfo}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            {isSuccess && (
              <>
                <Button
                  size="lg"
                  className="w-full rounded-xl font-semibold sm:w-auto"
                  onClick={() => router.push("/dashboard")}
                >
                  {t("goToDashboard")}
                  <ArrowRight className="ms-2 size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl sm:w-auto"
                  onClick={() => router.push("/dashboard/billing")}
                >
                  {t("manageBilling")}
                </Button>
              </>
            )}

            {isPending && (
              <>
                <Button
                  size="lg"
                  className="w-full rounded-xl font-semibold sm:w-auto"
                  onClick={() => router.push("/dashboard")}
                >
                  {t("goToDashboard")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl sm:w-auto"
                  onClick={() => router.push("/dashboard/billing")}
                >
                  {t("manageBilling")}
                </Button>
              </>
            )}

            {isFailed && (
              <>
                <Button
                  size="lg"
                  className="w-full rounded-xl font-semibold sm:w-auto"
                  onClick={() => router.push("/dashboard/billing")}
                >
                  {t("tryAgain")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl sm:w-auto"
                  onClick={() => router.push("/dashboard")}
                >
                  {t("goToDashboard")}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
