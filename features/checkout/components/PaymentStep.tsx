"use client"

import { useTranslations } from "next-intl"
import {
  Banknote,
  Check,
  ChevronLeft,
  CreditCard,
  Loader2,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"

export type PaymentMethod = "card" | "wallet" | "cash"

interface PaymentStepProps {
  paymentMethod: PaymentMethod
  deliveryFee: number
  isPlacingOrder?: boolean
  /**
   * Online methods enabled on the Paymob account, from GET /payments/methods.
   * Never hardcode this — enabling Vodafone Cash is a dashboard change, and a
   * hardcoded list would offer a method that fails at checkout.
   */
  enabledOnlineMethods?: ("card" | "wallet")[]
  onPaymentMethodChange: (method: PaymentMethod) => void
  onPlaceOrder: () => void
  onBack: () => void
}

export default function PaymentStep({
  paymentMethod,
  deliveryFee,
  isPlacingOrder = false,
  enabledOnlineMethods = [],
  onPaymentMethodChange,
  onPlaceOrder,
  onBack,
}: PaymentStepProps) {
  const t = useTranslations("Checkout")
  const { cartTotal } = useCart()
  const grandTotal = cartTotal + deliveryFee

  const options = [
    {
      id: "cash" as PaymentMethod,
      label: t("cashOnDelivery"),
      desc: t("cashOnDeliveryDesc"),
      Icon: Banknote,
    },
    ...(enabledOnlineMethods.includes("card")
      ? [
          {
            id: "card" as PaymentMethod,
            label: t("creditCard"),
            desc: t("creditCardDesc"),
            Icon: CreditCard,
          },
        ]
      : []),
    ...(enabledOnlineMethods.includes("wallet")
      ? [
          {
            id: "wallet" as PaymentMethod,
            label: t("mobileWallet"),
            desc: t("mobileWalletDesc"),
            Icon: Smartphone,
          },
        ]
      : []),
  ]

  const isOnline = paymentMethod === "card" || paymentMethod === "wallet"

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-6 lg:p-8 space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("paymentMethod")}</h2>

      <div className="space-y-3">
        {options.map(({ id, label, desc, Icon }) => {
          const selected = paymentMethod === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onPaymentMethodChange(id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl p-4 text-start transition-colors duration-200",
                selected
                  ? "border-2 border-primary bg-secondary/60"
                  : "border border-border bg-card hover:border-primary/40"
              )}
            >
              <div
                className={cn(
                  "size-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  selected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>

              {selected && (
                <Check
                  className="size-4 text-primary shrink-0"
                  strokeWidth={2.5}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Say plainly that the next tap leaves the site. An unexpected redirect
          to a payment page is where checkouts get abandoned. */}
      {isOnline && (
        <p className="text-muted-foreground text-xs">{t("redirectNotice")}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={isPlacingOrder}
          className="h-12 rounded-full px-6 gap-1.5 text-sm font-semibold border-border"
        >
          <ChevronLeft className="size-4 rtl:-scale-x-100" />
          {t("back")}
        </Button>
        <Button
          onClick={onPlaceOrder}
          disabled={isPlacingOrder}
          className="flex-1 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold gap-2"
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {isOnline ? t("redirecting") : t("placingOrder")}
            </>
          ) : (
            <>
              {isOnline ? t("payNow") : t("placeOrder")} ·{" "}
              {grandTotal.toLocaleString()} EGP
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
