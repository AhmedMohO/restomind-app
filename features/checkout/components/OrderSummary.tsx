"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"

interface OrderSummaryProps {
  deliveryFee: number
}

export default function OrderSummary({ deliveryFee }: OrderSummaryProps) {
  const t = useTranslations("OrderSummary")
  const { cart, cartTotal } = useCart()
  const grandTotal = cartTotal + deliveryFee

  return (
    <div className="sticky top-8 rounded-2xl bg-card border border-border/40 p-6 space-y-5">
      <h2 className="text-lg font-bold text-foreground">{t("title")}</h2>

      {/* Cart items */}
      <div className="space-y-4">
        {cart.map((item) => (
          <div key={item.product._id} className="flex items-center gap-3">
            <div className="relative size-14 rounded-xl overflow-hidden shrink-0 border border-border/30">
              <Image
                src={item.product.image?.secure_url || "/placeholder.svg"}
                alt={item.product.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {item.product.title}
              </p>
              <p className="text-xs text-muted-foreground">×{item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-foreground shrink-0">
              {(item.product.price * item.quantity).toLocaleString()} EGP
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/60" />

      {/* Totals */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="font-medium text-foreground">{cartTotal.toLocaleString()} EGP</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("delivery")}</span>
          <span
            className={cn(
              "font-medium",
              deliveryFee === 0 ? "text-primary font-semibold" : "text-foreground"
            )}
          >
            {deliveryFee === 0 ? t("free") : `${deliveryFee.toLocaleString()} EGP`}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/60" />

      {/* Grand total */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-foreground">{t("total")}</span>
        <span className="text-xl font-bold text-primary">
          {grandTotal.toLocaleString()} EGP
        </span>
      </div>
    </div>
  )
}
