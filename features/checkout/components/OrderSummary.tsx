"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"
import { Link } from "@/i18n/routing"

interface OrderSummaryProps {
  deliveryFee: number
}

export default function OrderSummary({ deliveryFee }: OrderSummaryProps) {
  const t = useTranslations("OrderSummary")
  const tCart = useTranslations("Cart")
  const { cart, cartTotal, updateQuantity, removeFromCart } = useCart()
  const grandTotal = cartTotal + deliveryFee

  if (cart.length === 0) {
    return (
      <div className="sticky top-8 flex flex-col items-center justify-center space-y-4 rounded-2xl border border-border/40 bg-card p-6 text-center shadow-xs">
        <div className="rounded-full bg-muted p-4 text-primary">
          <ShoppingBag className="size-8 stroke-[1.5]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-base font-bold text-foreground">
            {tCart("empty")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {tCart("emptyDesc")}
          </p>
        </div>
        <Link
          href="/offers"
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          {tCart("startShopping")}
        </Link>
      </div>
    )
  }

  return (
    <div className="sticky top-8 space-y-5 rounded-2xl border border-border/40 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t("title")}</h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {cart.length} {tCart("items")}
        </span>
      </div>

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
            <div
              key={item.offer._id}
              className="relative flex items-center justify-between gap-3 border-b border-border/40 pb-4 last:border-0 last:pb-0"
            >
              {/* Product Image */}
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border/30">
                <Image
                  src={itemImage}
                  alt={itemTitle}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Product Info & Controls */}
              <div className="min-w-0 flex-1 space-y-1.5 text-start">
                <div className="flex items-center justify-between pe-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {itemTitle}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.offer._id)}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title={tCart("remove")}
                    aria-label={tCart("remove")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-full border border-border bg-muted/50 px-1 py-0.5">
                    <button
                      onClick={() =>
                        updateQuantity(item.offer._id, item.quantity - 1)
                      }
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="min-w-[16px] px-1.5 text-center text-xs font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.offer._id, item.quantity + 1)
                      }
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Price */}
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
