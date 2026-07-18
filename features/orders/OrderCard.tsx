"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { Truck, Clock, Heart, FileText, MessageSquare, XCircle, RotateCcw, Check, Loader2 } from "lucide-react"
import { Order, OrderStatus } from "./data"
import { useCart } from "@/hooks/use-cart"
import { MOCK_PRODUCTS } from "@/features/products/data"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  order: Order
  isFirst: boolean
  isLast: boolean
}

export default function OrderCard({ order, isFirst, isLast }: OrderCardProps) {
  const t = useTranslations("Orders")
  const { addToCart } = useCart()
  
  // Local UI States
  const [favorite, setFavorite] = useState(order.isFavorite || false)
  const [reordered, setReordered] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status)

  // Status configuration helper
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return {
          icon: Truck,
          color: "bg-[#529E66] text-white dark:bg-emerald-600",
          badgeClass: "bg-emerald-50/80 text-[#529E66] border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
          labelKey: "statusDelivered"
        }
      case "out_for_delivery":
        return {
          icon: Truck,
          color: "bg-[#3B82F6] text-white dark:bg-blue-600",
          badgeClass: "bg-blue-50/80 text-[#3B82F6] border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
          labelKey: "statusOutForDelivery"
        }
      case "pending":
        return {
          icon: Clock,
          color: "bg-[#7C4A27] text-white dark:bg-[#C2733C]",
          badgeClass: "bg-amber-50/80 text-[#7C4A27] border-amber-100/50 dark:bg-amber-950/20 dark:text-[#E68A49] dark:border-amber-900/30",
          labelKey: "statusPending"
        }
      case "cancelled":
        return {
          icon: XCircle,
          color: "bg-[#EF4444] text-white dark:bg-rose-600",
          badgeClass: "bg-rose-50/80 text-[#EF4444] border-rose-100/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
          labelKey: "statusCancelled"
        }
    }
  }

  const config = getStatusConfig(currentStatus)
  const StatusIcon = config.icon

  // Action Handlers
  const handleToggleFavorite = () => {
    setFavorite(!favorite)
  }

  const handleReorder = () => {
    setIsReordering(true)
    setTimeout(() => {
      order.items.forEach((item) => {
        // Find existing product details from catalog to push to cart context correctly
        const matchedProduct = MOCK_PRODUCTS.find((p) => p._id === item.id)
        
        const productToInsert = matchedProduct || {
          _id: item.id,
          title: item.title,
          description: "",
          longDescription: "",
          price: 95,
          discountedPrice: 0,
          rating: 4.8,
          reviewsCount: 12,
          isBestseller: false,
          isAvailable: true,
          image: { public_id: item.id, secure_url: item.image },
          category: { _id: "pastry", name: "Pastry", description: "", image: { public_id: "", secure_url: "" }, isDeleted: false, createdAt: "", updatedAt: "" },
          freshnessWindow: 12,
          tags: [],
          isDeleted: false,
          createdAt: "",
          updatedAt: "",
        }

        addToCart(productToInsert, item.quantity)
      })

      setIsReordering(false)
      setReordered(true)
      setTimeout(() => setReordered(false), 2000)
    }, 800)
  }

  const handleDownloadInvoice = () => {
    setInvoiceLoading(true)
    setTimeout(() => {
      setInvoiceLoading(false)
      alert(`Simulated invoice download for order ${order.id}. This handles front-end action.`);
    }, 1000)
  }

  const handleSupport = () => {
    setSupportLoading(true)
    setTimeout(() => {
      setSupportLoading(false)
      alert(`Redirecting to support chat for order ${order.id}.`);
    }, 800)
  }

  const handleCancelOrder = () => {
    if (confirm("Are you sure you want to cancel this order?")) {
      setCancelLoading(true)
      setTimeout(() => {
        setCancelLoading(false)
        setCurrentStatus("cancelled")
      }, 1000)
    }
  }

  return (
    <div className="relative flex gap-4 md:gap-6 group">
      {/* Timeline Section */}
      <div className="flex flex-col items-center shrink-0 w-9 md:w-10 relative">
        {/* Timeline connector line */}
        {!isLast && (
          <div 
            className="absolute top-9 bottom-0 w-[2px] bg-[#ECE6DB] dark:bg-neutral-800 z-0"
            style={{ height: "calc(100% + 1.5rem)" }} 
          />
        )}
        {isFirst && !isLast && (
          <div className="absolute top-0 bottom-[90%] w-[2px] bg-[#ECE6DB] dark:bg-neutral-800 z-0" />
        )}
        {isLast && !isFirst && (
          <div className="absolute top-0 bottom-[90%] w-[2px] bg-[#ECE6DB] dark:bg-neutral-800 z-0" />
        )}

        {/* Timeline Indicator Badge */}
        <div className={cn(
          "relative z-10 flex size-9 md:size-10 items-center justify-center rounded-full shadow-sm transition-all duration-300",
          config.color
        )}>
          <StatusIcon className="size-4 md:size-5" />
        </div>
      </div>

      {/* Main Order Card */}
      <div className="flex-1 overflow-hidden rounded-[24px] md:rounded-[32px] border border-[#ECE6DB] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 md:p-6 shadow-xs hover:shadow-sm transition-all duration-300">
        
        {/* Header: Title, Date, Status */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4">
          <div className="space-y-1 text-left rtl:text-right">
            <h3 className="font-serif text-lg md:text-xl font-bold tracking-tight text-[#2B1B15] dark:text-neutral-100">
              {t("orderNo")} {order.id}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {order.date}
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <span className={cn(
              "inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border",
              config.badgeClass
            )}>
              {t(config.labelKey)}
            </span>
          </div>
        </div>

        {/* Middle: Items Pills */}
        <div className="flex flex-wrap gap-2.5 py-3">
          {order.items.map((item, idx) => (
            <div 
              key={idx}
              className="inline-flex items-center gap-2 bg-[#FAF7F2]/60 dark:bg-neutral-850 border border-[#ECE6DB] dark:border-neutral-800/80 rounded-full pl-1.5 pr-3.5 py-1 text-xs text-[#2B1B15] dark:text-neutral-300 max-w-full"
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="size-7 rounded-full object-cover shrink-0"
              />
              <span className="truncate font-medium">
                {item.title}
              </span>
              <span className="text-muted-foreground shrink-0 border-l border-[#ECE6DB] dark:border-neutral-800 pl-2 rtl:border-r rtl:border-l-0 rtl:pl-0 rtl:pr-2">
                × {item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr className="border-t border-[#ECE6DB] dark:border-neutral-800 my-4" />

        {/* Footer: Price & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Price */}
          <div className="text-left rtl:text-right">
            <span className="font-serif text-lg md:text-xl font-bold text-[#2B1B15] dark:text-neutral-100">
              {order.totalPrice} {order.currency}
            </span>
          </div>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            
            {/* Favorite toggle */}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "rounded-full size-9 border transition-colors flex items-center justify-center",
                favorite 
                  ? "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/30 dark:border-rose-900/50" 
                  : "bg-white border-[#ECE6DB] text-muted-foreground hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-850"
              )}
              title={t("favorite")}
            >
              <Heart className={cn("size-4", favorite ? "fill-current text-rose-500" : "")} />
            </button>

            {/* Invoice button */}
            <button
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading}
              className="h-9 px-4 rounded-full border border-[#ECE6DB] hover:bg-[#FAF7F2] text-xs font-semibold text-[#2B1B15] transition-colors flex items-center gap-1.5 dark:border-neutral-800 dark:hover:bg-neutral-850 dark:text-neutral-300 disabled:opacity-50"
            >
              {invoiceLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              <span>{t("invoice")}</span>
            </button>

            {/* Support button */}
            <button
              onClick={handleSupport}
              disabled={supportLoading}
              className="h-9 px-4 rounded-full border border-[#ECE6DB] hover:bg-[#FAF7F2] text-xs font-semibold text-[#2B1B15] transition-colors flex items-center gap-1.5 dark:border-neutral-800 dark:hover:bg-neutral-850 dark:text-neutral-300 disabled:opacity-50"
            >
              {supportLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <MessageSquare className="size-3.5" />
              )}
              <span>{t("support")}</span>
            </button>

            {/* Status-dependent Primary Action: Track / Cancel / Reorder */}
            {currentStatus === "pending" && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="h-9 px-4 rounded-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-semibold text-rose-600 transition-colors flex items-center gap-1.5 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/30 disabled:opacity-50"
              >
                {cancelLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <XCircle className="size-3.5" />
                )}
                <span>{t("cancel")}</span>
              </button>
            )}

            {currentStatus === "out_for_delivery" && (
              <button
                onClick={() => alert(`Showing tracking map for order ${order.id}`)}
                className="h-9 px-4 rounded-full bg-[#3B82F6] text-white hover:bg-blue-600 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm active:translate-y-px"
              >
                <Truck className="size-3.5 animate-pulse" />
                <span>{t("track")}</span>
              </button>
            )}

            {(currentStatus === "delivered" || currentStatus === "cancelled") && (
              <button
                onClick={handleReorder}
                disabled={isReordering}
                className={cn(
                  "h-9 px-5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs active:translate-y-px",
                  reordered 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                    : "bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
                )}
              >
                {isReordering ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : reordered ? (
                  <Check className="size-3.5" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                <span>{reordered ? t("items") : t("reorder")}</span>
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
