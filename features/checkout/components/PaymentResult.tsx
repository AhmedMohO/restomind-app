"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { fetchOrderGroupStatusAction } from "@/features/orders/actions"
import { reconcilePaymentAction } from "@/features/payments/actions"
import { useCart } from "@/hooks/use-cart"

/** How often to re-ask the server, and for how long before giving up. */
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 90_000

type Phase = "confirming" | "paid" | "failed" | "timeout"

/**
 * Shown when the customer returns from Paymob.
 *
 * The redirect query string is deliberately ignored. Those parameters are not
 * authenticated — anyone can craft a URL claiming success. The only source of
 * truth is the order status on our own server, which is set by the
 * HMAC-verified webhook.
 */
export default function PaymentResult({
  groupId,
  paymobOrderId,
}: {
  groupId: string | null
  paymobOrderId: string | null
}) {
  const t = useTranslations("Checkout")
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("confirming")
  const startedAt = useRef(Date.now())
  const nudged = useRef(false)
  const { refreshCart } = useCart()

  const poll = useCallback(async () => {
    if (!groupId) {
      setPhase("timeout")
      return
    }

    const status = await fetchOrderGroupStatusAction(groupId)

    if (status === "Awaiting Payment" || status === null) {
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        // Not a failure. A missed callback is resolved by the server's
        // reconciliation sweep, so the honest answer is "we're still checking".
        setPhase("timeout")
      }
      return
    }

    if (status === "Payment Failed") {
      setPhase("failed")
      return
    }

    // The cart is emptied server-side by the payment fulfiller, but this page
    // loads before that happens — the provider fetched the cart while the
    // payment was still settling, so it holds items that no longer exist.
    // Without this the customer sees a full basket for the order they just
    // bought, and the counter only clears on a hard refresh.
    setPhase("paid")
    void refreshCart()
  }, [groupId, refreshCart])

  useEffect(() => {
    // Stop once the answer is in. Polling a settled order forever would also
    // re-fetch the cart every two seconds for as long as the tab stayed open.
    if (phase !== "confirming") return

    // Nudge the server to settle this payment now rather than waiting for a
    // callback that may be slow, then fall back to polling either way.
    if (!nudged.current) {
      nudged.current = true
      void reconcilePaymentAction(paymobOrderId).then(poll)
    }

    const id = setInterval(() => {
      void poll()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [poll, paymobOrderId, phase])

  const content = {
    confirming: {
      Icon: Loader2,
      iconClass: "text-primary animate-spin",
      title: t("confirmingTitle"),
      body: t("confirmingBody"),
    },
    paid: {
      Icon: CheckCircle2,
      iconClass: "text-emerald-600 dark:text-emerald-500",
      title: t("paidTitle"),
      body: t("paidBody"),
    },
    failed: {
      Icon: XCircle,
      iconClass: "text-destructive",
      title: t("failedTitle"),
      body: t("failedBody"),
    },
    timeout: {
      Icon: Clock,
      iconClass: "text-amber-600 dark:text-amber-500",
      title: t("pendingTitle"),
      body: t("pendingBody"),
    },
  }[phase]

  const { Icon, iconClass, title, body } = content

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <Icon className={`mb-5 size-14 ${iconClass}`} aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{body}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {phase === "paid" && (
          <Button onClick={() => router.push("/orders")}>
            {t("viewOrders")}
          </Button>
        )}
        {phase === "failed" && (
          <>
            {/* The cart was preserved on purpose, so retrying is one tap. */}
            <Button onClick={() => router.push("/checkout")}>
              {t("tryAgain")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/offers")}>
              {t("backToOffers")}
            </Button>
          </>
        )}
        {phase === "timeout" && (
          <Button variant="outline" onClick={() => router.push("/orders")}>
            {t("viewOrders")}
          </Button>
        )}
      </div>
    </div>
  )
}
