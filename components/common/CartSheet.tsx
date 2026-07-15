"use client"

import React, { useSyncExternalStore } from "react"
import { useCart } from "@/hooks/use-cart"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import Image from "next/image"
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from "lucide-react"
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

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function CartSheet() {
  const t = useTranslations("Cart")
  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart()
  const isMounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  return (
    <Sheet>
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
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7C4A27] text-[10px] font-bold text-white ring-2 ring-background dark:bg-[#C2733C] animate-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent side="right" className="w-[380px] sm:w-[450px] p-0 flex flex-col h-full bg-white dark:bg-neutral-900 border-l border-border/40 dark:border-neutral-800 transition-colors">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border/50 dark:border-neutral-800 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <SheetTitle className="text-left font-serif text-xl font-bold text-[#2B1B15] dark:text-neutral-100 rtl:text-right">
              {t("title")}
            </SheetTitle>
            <SheetDescription className="text-left text-xs text-muted-foreground rtl:text-right">
              {isMounted ? `${cartCount} ${t("items")}` : `0 ${t("items")}`}
            </SheetDescription>
          </div>
          {isMounted && cart.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={clearCart}
              className="rounded-full text-[10px] font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/20 h-7 px-3 gap-1.5 uppercase tracking-wider transition-colors shrink-0"
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
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-12 animate-in fade-in duration-300">
              <div className="bg-[#FAF2ED] dark:bg-neutral-850 p-5 rounded-full text-[#7C4A27] dark:text-[#E68A49] transition-colors">
                <ShoppingBag size={44} className="stroke-[1.5]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
                  {t("empty")}
                </h3>
                <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
                  {t("emptyDesc")}
                </p>
              </div>
              <SheetClose
                nativeButton={false}
                render={
                  <Link
                    href="/offers"
                    className="inline-flex h-9 items-center justify-center rounded-full bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432] text-xs font-semibold px-6 transition-all shadow-sm"
                  >
                    {t("startShopping")}
                  </Link>
                }
              />
            </div>
          ) : (
            /* Items List */
            <div className="space-y-6">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 items-center justify-between border-b border-dashed border-[#ECE6DB] dark:border-neutral-800 pb-5 last:border-0 last:pb-0 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative h-16 w-16 overflow-hidden rounded-[14px] border border-[#ECE6DB] bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-850 shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.title}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Product Details & Quantity controls */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="font-serif text-sm font-bold text-[#2B1B15] dark:text-neutral-100 truncate pr-2 rtl:pr-0 rtl:pl-2">
                      {item.product.title}
                    </h4>
                    <p className="text-xs text-[#7C4A27] dark:text-[#E68A49] font-medium">
                      {item.product.price} EGP
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center rounded-full border border-[#ECE6DB] bg-white dark:border-neutral-800 dark:bg-neutral-900 px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-full text-muted-foreground hover:bg-[#FAF7F2] dark:hover:bg-neutral-800 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold px-2 text-[#2B1B15] dark:text-neutral-200 min-w-[14px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 rounded-full text-muted-foreground hover:bg-[#FAF7F2] dark:hover:bg-neutral-800 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex flex-col items-end justify-between self-stretch py-0.5">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title={t("remove")}
                      aria-label={t("remove")}
                    >
                      <Trash2 size={14} />
                    </button>
                    <p className="text-xs font-bold text-[#2B1B15] dark:text-neutral-100">
                      {(item.product.price * item.quantity).toLocaleString()} EGP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {isMounted && cart.length > 0 && (
          <SheetFooter className="p-6 border-t border-border/50 dark:border-neutral-800 bg-[#FAF7F2]/50 dark:bg-neutral-950/20 mt-0 flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-[#2B1B15] dark:text-neutral-300 font-serif">
                {t("subtotal")}
              </span>
              <span className="text-lg font-serif font-bold text-[#2B1B15] dark:text-neutral-100">
                {cartTotal.toLocaleString()} EGP
              </span>
            </div>
            
            <Button
              className="w-full rounded-full py-6 font-sans text-sm font-semibold bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432] shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              {t("checkout")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
