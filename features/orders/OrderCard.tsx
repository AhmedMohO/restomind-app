"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Store, Eye, Tag, RotateCcw, Check, Loader2 } from "lucide-react"
import type { ApiOrder } from "@/features/orders/api/type"
import { getStatusMeta } from "@/features/orders/status"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  order: ApiOrder
}

export default function OrderCard({ order }: OrderCardProps) {
  const t = useTranslations("Orders")
  const [reordered, setReordered] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  const meta = getStatusMeta(order.status)
  const StatusIcon = meta.Icon

  // Format date
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(order.createdAt))

  const shortId = order._id.slice(-8).toUpperCase()

  // Discounts
  const hasDiscount = order.totalDiscount > 0
  const discountPercent =
    hasDiscount && order.totalOriginalPrice > 0
      ? Math.round((order.totalDiscount / order.totalOriginalPrice) * 100)
      : 0

  // Max item chips visible before "+N more"
  const MAX_VISIBLE_CHIPS = 3
  const visibleItems = order.items.slice(0, MAX_VISIBLE_CHIPS)
  const remainingCount = order.items.length - MAX_VISIBLE_CHIPS

  const handleReorder = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsReordering(true)
    setTimeout(() => {
      setIsReordering(false)
      setReordered(true)
      setTimeout(() => setReordered(false), 2000)
    }, 800)
  }

  return (
    <Link href={`/orders/${order._id}`} className="block group">
      <Card className="rounded-[24px] md:rounded-[28px] border-[#ECE6DB] bg-white dark:bg-neutral-900 dark:border-neutral-800 shadow-2xs hover:shadow-sm hover:border-[#7C4A27]/40 dark:hover:border-neutral-700 transition-all duration-200 overflow-hidden">
        {/* Header: Restaurant info (left) & Status badge (right) */}
        <CardHeader className="p-4 md:p-5 pb-3 border-b border-[#ECE6DB]/60 dark:border-neutral-800/60">
          <div className="flex items-center justify-between gap-3">
            {/* Restaurant & Date */}
            <div className="flex items-center gap-3 min-w-0 text-start">
              <div className="size-10 rounded-2xl bg-[#F5EDE5] dark:bg-neutral-800 flex items-center justify-center text-[#7C4A27] dark:text-[#C2733C] shrink-0 border border-[#ECE6DB]/60 dark:border-neutral-700/60">
                <Store className="size-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-[#1A0F0A] dark:text-neutral-100 truncate group-hover:text-[#7C4A27] dark:group-hover:text-[#C2733C] transition-colors">
                    {order.restaurantId.name}
                  </h3>
                  <span className="text-xs font-mono font-semibold text-[#8C7060] dark:text-neutral-400">
                    #{shortId}
                  </span>
                </div>
                <p className="text-xs text-[#6B4C3B] dark:text-neutral-400 font-medium">{formattedDate}</p>
              </div>
            </div>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn("px-3 py-1 text-xs font-bold shrink-0 gap-1.5", meta.badgeClass)}
            >
              <StatusIcon className="size-3.5" />
              <span>{t(meta.labelKey )}</span>
            </Badge>
          </div>
        </CardHeader>

        {/* Content: Item preview badges (Max 3 + "+N more") */}
        <CardContent className="p-4 md:p-5 py-3">
          <div className="flex flex-wrap items-center gap-1.5 text-start">
            {visibleItems.map((item, idx) => (
              <Badge
                key={`${item.productId}-${idx}`}
                variant="secondary"
                className="bg-[#FAF7F2] dark:bg-neutral-800/80 text-[#2B1B15] dark:text-neutral-200 border border-[#ECE6DB] dark:border-neutral-750 px-2.5 py-1 text-xs font-medium rounded-full max-w-[220px] truncate"
              >
                <span className="font-bold text-[#7C4A27] dark:text-[#C2733C] me-1">
                  {item.quantity}×
                </span>
                <span className="truncate">{item.title}</span>
              </Badge>
            ))}

            {remainingCount > 0 && (
              <Badge
                variant="outline"
                className="border-[#ECE6DB] dark:border-neutral-750 text-[#6B4C3B] dark:text-neutral-400 px-2.5 py-1 text-xs font-semibold rounded-full bg-white dark:bg-neutral-850"
              >
                +{remainingCount} {t("more")}
              </Badge>
            )}
          </div>
        </CardContent>

        {/* Footer: Price summary (left) & Actions (right) */}
        <CardFooter className="p-4 md:p-5 pt-3 border-t border-[#ECE6DB]/60 dark:border-neutral-800/60 flex items-center justify-between gap-4">
          {/* Price & Savings */}
          <div className="space-y-1 text-start">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg md:text-xl font-extrabold text-[#1A0F0A] dark:text-neutral-100">
                {order.finalTotalPrice.toFixed(2)} EGP
              </span>
              {hasDiscount && (
                <span className="text-xs line-through text-[#9E7E6C] dark:text-neutral-500 font-medium">
                  {order.totalOriginalPrice.toFixed(2)} EGP
                </span>
              )}
            </div>

            {hasDiscount && (
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 text-[11px] font-bold px-2 py-0.5 rounded-full gap-1"
              >
                <Tag className="size-3" />
                <span>
                  {t("saved")} {order.totalDiscount.toFixed(2)} EGP ({discountPercent}% OFF)
                </span>
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Details Button */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-[#ECE6DB] hover:bg-[#FAF7F2] text-xs font-semibold text-[#4A2E1E] dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Eye className="size-3.5 me-1" />
              <span>{t("viewDetails")}</span>
            </Button>

            {/* Reorder Button (Delivered / Cancelled) */}
            {(order.status === "Delivered" || order.status === "Cancelled") && (
              <Button
                variant="default"
                size="sm"
                onClick={handleReorder}
                disabled={isReordering}
                className={cn(
                  "rounded-full text-xs font-bold text-white transition-all shadow-xs",
                  reordered
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#2E7D4F] hover:bg-[#256040]"
                )}
              >
                {isReordering ? (
                  <Loader2 className="size-3.5 animate-spin me-1" />
                ) : reordered ? (
                  <Check className="size-3.5 me-1" />
                ) : (
                  <RotateCcw className="size-3.5 me-1" />
                )}
                <span>{reordered ? t("items") : t("reorder")}</span>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
