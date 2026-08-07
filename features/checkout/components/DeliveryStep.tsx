"use client"

import { useTranslations } from "next-intl"
import { Truck, MapPin, Check, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DELIVERY_FEE } from "@/features/checkout/constants"
import { cn } from "@/lib/utils"

export type DeliveryMethod = "home" | "pickup"

interface DeliveryStepProps {
  deliveryMethod: DeliveryMethod
  isSingleRestaurant?: boolean
  onDeliveryMethodChange: (method: DeliveryMethod) => void
  onContinue: () => void
  onBack: () => void
}

export default function DeliveryStep({
  deliveryMethod,
  isSingleRestaurant = true,
  onDeliveryMethodChange,
  onContinue,
  onBack,
}: DeliveryStepProps) {
  const t = useTranslations("Checkout")

  const options = [
    {
      id: "home" as DeliveryMethod,
      label: t("homeDelivery"),
      desc: t("homeDeliveryDesc", { fee: DELIVERY_FEE }),
      Icon: Truck,
      disabled: false,
    },
    {
      id: "pickup" as DeliveryMethod,
      label: t("storePickup"),
      desc: t("storePickupDesc"),
      Icon: MapPin,
      disabled: !isSingleRestaurant,
    },
  ]

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-6 lg:p-8 space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("deliveryMethod")}</h2>

      {!isSingleRestaurant && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="leading-relaxed font-medium">
            {t("multiRestaurantPickupDisabled")}
          </p>
        </div>
      )}

      {/* Delivery options */}
      <div className="space-y-3">
        {options.map(({ id, label, desc, Icon, disabled }) => {
          const selected = deliveryMethod === id
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  onDeliveryMethodChange(id)
                }
              }}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl p-4 text-start transition-colors duration-200",
                disabled
                  ? "opacity-60 cursor-not-allowed border border-border/40 bg-muted/20"
                  : selected
                    ? "border-2 border-primary bg-secondary/60"
                    : "border border-border hover:border-primary/40 bg-card"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "size-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  disabled
                    ? "bg-muted/50 text-muted-foreground/50"
                    : selected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  {disabled && (
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      {t("storePickupDisabledTag")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>

              {/* Checkmark */}
              {selected && !disabled && (
                <Check className="size-4 text-primary shrink-0" strokeWidth={2.5} />
              )}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={onBack}
          variant="outline"
          className="h-12 rounded-full px-6 gap-1.5 text-sm font-semibold border-border"
        >
          <ChevronLeft className="size-4 rtl:-scale-x-100" />
          {t("back")}
        </Button>
        <Button
          onClick={onContinue}
          className="flex-1 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm font-semibold"
        >
          {t("continue")}
          <ChevronRight className="size-4 rtl:-scale-x-100" />
        </Button>
      </div>
    </div>
  )
}
