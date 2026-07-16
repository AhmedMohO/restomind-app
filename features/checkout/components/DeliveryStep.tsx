"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Truck, MapPin, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type DeliveryMethod = "home" | "pickup"

interface DeliveryStepProps {
  deliveryMethod: DeliveryMethod
  promoCode: string
  onDeliveryMethodChange: (method: DeliveryMethod) => void
  onPromoCodeChange: (code: string) => void
  onContinue: () => void
  onBack: () => void
}

const DELIVERY_FEE = 15

export default function DeliveryStep({
  deliveryMethod,
  promoCode,
  onDeliveryMethodChange,
  onPromoCodeChange,
  onContinue,
  onBack,
}: DeliveryStepProps) {
  const t = useTranslations("Checkout")
  const [promoInput, setPromoInput] = useState(promoCode)

  const options = [
    {
      id: "home" as DeliveryMethod,
      label: t("homeDelivery"),
      desc: t("homeDeliveryDesc", { fee: DELIVERY_FEE }),
      Icon: Truck,
    },
    {
      id: "pickup" as DeliveryMethod,
      label: t("storePickup"),
      desc: t("storePickupDesc"),
      Icon: MapPin,
    },
  ]

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-6 lg:p-8 space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("deliveryMethod")}</h2>

      {/* Delivery options */}
      <div className="space-y-3">
        {options.map(({ id, label, desc, Icon }) => {
          const selected = deliveryMethod === id
          return (
            <button
              key={id}
              onClick={() => onDeliveryMethodChange(id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl p-4 text-start transition-colors duration-200",
                selected
                  ? "border-2 border-primary bg-secondary/60"
                  : "border border-border hover:border-primary/40 bg-card"
              )}
            >
              {/* Icon */}
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

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>

              {/* Checkmark */}
              {selected && (
                <Check className="size-4 text-primary shrink-0" strokeWidth={2.5} />
              )}
            </button>
          )
        })}
      </div>

      {/* Promo Code */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("promoCode")}</label>
        <div className="flex gap-3">
          <Input
            className="h-12 rounded-full bg-secondary border-transparent px-5 text-sm flex-1 placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-transparent"
            placeholder={t("promoPlaceholder")}
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            dir="ltr"
          />
          <Button
            onClick={() => onPromoCodeChange(promoInput)}
            className="h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 shrink-0 text-sm font-semibold"
          >
            {t("apply")}
          </Button>
        </div>
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
