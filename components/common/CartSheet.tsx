"use client"

import { useSyncExternalStore } from "react"
import { useCart } from "@/hooks/use-cart"
import { getCartItemRestaurantName } from "@/features/cart/utils"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import Image from "next/image"
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, Store } from "lucide-react"
import { getImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "../ui/badge"

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function CartSheet() {
  const t = useTranslations("Cart")
  const tOffers = useTranslations("Offers")
  const locale = useLocale()
  const {
    cart,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  } = useCart()
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot
  )

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open) refreshCart()
      }}
    >
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative"
            aria-label="Open cart"
            nativeButton
          >
            <ShoppingCart className="size-4" />
            {isMounted && cartCount > 0 && (
              <span className="absolute end-[-6px] -top-1.5 flex h-5 w-5 animate-in items-center justify-center rounded-full bg-[#7C4A27] text-[10px] font-bold text-white ring-2 ring-background duration-200 zoom-in dark:bg-[#C2733C]">
                {cartCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="flex h-full w-[380px] flex-col border-s border-border/40 bg-white p-0 sm:w-[450px] dark:border-neutral-800 dark:bg-neutral-900"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border/50 p-6 text-start dark:border-neutral-800">
          <div className="space-y-0.5">
            <SheetTitle className="text-start font-serif text-xl font-bold text-[#2B1B15] dark:text-neutral-100">
              {t("title")}
            </SheetTitle>
            <SheetDescription className="text-start text-xs text-muted-foreground">
              {isMounted ? `${cartCount} ${t("items")}` : `0 ${t("items")}`}
            </SheetDescription>
          </div>
          {isMounted && cart.length > 0 && (
            <Button
              variant="outline"
              size="xs"
              onClick={clearCart}
              className="me-6 h-7 shrink-0 gap-1.5 rounded-full px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-950/20"
              nativeButton
            >
              <Trash2 className="size-3" />
              <span>{t("clear")}</span>
            </Button>
          )}
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isMounted || cart.length === 0 ? (
            /* Empty State */
            <div className="flex h-full animate-in flex-col items-center justify-center space-y-5 py-12 text-center duration-300 fade-in">
              <div className="dark:bg-neutral-850 rounded-full bg-[#FAF2ED] p-5 text-[#7C4A27] transition-colors dark:text-[#E68A49]">
                <ShoppingBag size={44} className="stroke-[1.5]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                  {t("empty")}
                </h3>
                <p className="max-w-[250px] text-xs leading-relaxed text-muted-foreground">
                  {t("emptyDesc")}
                </p>
              </div>
              <SheetClose
                nativeButton={false}
                render={
                  <Link
                    href="/offers"
                    className="inline-flex h-9 items-center justify-center rounded-full bg-[#7C4A27] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
                  >
                    {t("startShopping")}
                  </Link>
                }
              />
            </div>
          ) : (
            /* Items List */
            <div className="space-y-6">
              {cart.map((item) => {
                const productObj = item.offer.productId
                const itemTitle = productObj?.title || ""
                const restaurantName = getCartItemRestaurantName(item)
                const itemImage = getImageUrl(productObj?.image?.secure_url)
                const originalPrice =
                  item.unitOriginalPrice ?? item.offer.originalPrice ?? 0
                const discountedPrice =
                  item.unitOfferPrice ?? item.offer.offerPrice ?? 0
                const discountPercentage = item.offer.discountPercentage ?? 0
                const hasDiscount = originalPrice > discountedPrice
                return (
                  <div
                    key={item.offer._id}
                    className="relative flex items-center justify-between gap-4 border-b border-dashed border-[#ECE6DB] pb-5 transition-colors last:border-0 last:pb-0 dark:border-neutral-800"
                  >
                    {/* Product Image */}
                    <div className="dark:bg-neutral-850 relative h-18 w-18 shrink-0 overflow-hidden rounded-md border border-[#ECE6DB] bg-[#FAF7F2] dark:border-neutral-800">
                      <Image
                        src={itemImage}
                        alt={itemTitle}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                      {hasDiscount && (
                        <Badge className="absolute end-1 top-1 z-10">
                          -{discountPercentage}%
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.offer._id)}
                      className="absolute end-0 top-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                      title={t("remove")}
                      aria-label={t("remove")}
                    >
                      <Trash2 size={14} />
                    </button>
                    {/* Product Details & Quantity controls */}
                    <div className="min-w-0 flex-1 space-y-1.5 text-start">
                      <h4 className="truncate pe-6 font-serif text-sm font-bold text-[#2B1B15] dark:text-neutral-100">
                        {itemTitle}
                      </h4>
                      {restaurantName && (
                        <p className="truncate text-xs text-muted-foreground flex items-center gap-1 font-medium pe-6">
                          <Store size={12} className="shrink-0 text-primary/80" />
                          <span className="truncate">{restaurantName}</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between self-stretch py-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center rounded-full border border-[#ECE6DB] bg-white px-1 py-0.5 dark:border-neutral-800 dark:bg-neutral-900">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.offer._id,
                                  item.quantity - 1
                                )
                              }
                              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-[#FAF7F2] dark:hover:bg-neutral-800"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="min-w-[14px] px-2 text-center text-xs font-bold text-[#2B1B15] dark:text-neutral-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.offer._id,
                                  item.quantity + 1
                                )
                              }
                              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-[#FAF7F2] dark:hover:bg-neutral-800"
                              aria-label="Increase quantity"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-end">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-[#2B1B15] dark:text-neutral-100">
                              {(
                                discountedPrice * item.quantity
                              ).toLocaleString()}{" "}
                              {tOffers("egp")}
                            </p>
                          </div>
                          {hasDiscount && (
                            <p className="text-[10px] font-medium text-neutral-400 line-through">
                              {(originalPrice * item.quantity).toLocaleString()}{" "}
                              {tOffers("egp")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {isMounted && cart.length > 0 && (
          <SheetFooter className="mt-0 flex flex-col gap-4 border-t border-border/50 bg-[#FAF7F2]/50 p-6 dark:border-neutral-800 dark:bg-neutral-950/20">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="font-serif text-[#2B1B15] dark:text-neutral-300">
                {t("subtotal")}
              </span>
              <span className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                {cartTotal.toLocaleString()} {tOffers("egp")}
              </span>
            </div>
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href="/checkout"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
                >
                  {t("checkout")}
                </Link>
              }
            />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
