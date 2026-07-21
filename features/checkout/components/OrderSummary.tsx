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
    <div className="sticky top-8 space-y-5 rounded-2xl border border-border/40 bg-card p-6">
      <h2 className="text-lg font-bold text-foreground">{t("title")}</h2>

      {/* Cart items */}
      <div className="space-y-4">
        {cart.map((item) => {
          const productObj = item.offer.productId
          const itemTitle = productObj?.title || ""
          const itemImage = productObj?.image?.secure_url || "/placeholder.svg"
          const originalPrice =
            item.unitOriginalPrice ?? item.offer.originalPrice ?? 0
          const discountedPrice =
            item.unitOfferPrice ?? item.offer.offerPrice ?? 0
          const hasDiscount = originalPrice > discountedPrice
          return (
            <div key={item.offer._id} className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border/30">
                <Image
                  src={itemImage}
                  alt={itemTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {itemTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  ×{item.quantity}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-medium text-foreground">
                  {(discountedPrice * item.quantity).toLocaleString()} EGP
                </span>
                {hasDiscount && (
                  <p className="text-[10px] text-muted-foreground line-through">
                    {(originalPrice * item.quantity).toLocaleString()} EGP
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/60" />

      {/* Totals */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="font-medium text-foreground">
            {cartTotal.toLocaleString()} EGP
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("delivery")}</span>
          <span
            className={cn(
              "font-medium",
              deliveryFee === 0
                ? "font-semibold text-primary"
                : "text-foreground"
            )}
          >
            {deliveryFee === 0
              ? t("free")
              : `${deliveryFee.toLocaleString()} EGP`}
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
