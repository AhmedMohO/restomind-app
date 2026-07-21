"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import RestaurantOrderCard from "@/features/orders/RestaurantOrderCard"
import type { ApiOrderGroup, OrderStatus } from "@/features/orders/api/type"
import { cn } from "@/lib/utils"

interface RestaurantOrderCarouselProps {
  orderGroup: ApiOrderGroup
  t: (key: string, values?: Record<string, string | number>) => string
}

function getStatusDotClass(status: OrderStatus) {
  const norm = String(status || "").toLowerCase().replace(/_/g, " ")
  switch (norm) {
    case "pending":
      return "bg-amber-500 ring-amber-200 dark:ring-amber-900/60"
    case "preparing":
    case "confirmed":
    case "out for delivery":
      return "bg-blue-500 ring-blue-200 dark:ring-blue-900/60"
    case "ready":
      return "bg-emerald-500 ring-emerald-200 dark:ring-emerald-900/60"
    case "delivered":
      return "bg-gray-400 ring-gray-200 dark:ring-neutral-700"
    case "cancelled":
    case "canceled":
      return "bg-rose-500 ring-rose-200 dark:ring-rose-900/60"
    default:
      return "bg-amber-500 ring-amber-200"
  }
}

function isReady(status: OrderStatus) {
  const norm = String(status || "").toLowerCase().replace(/_/g, " ")
  return norm === "ready"
}

export default function RestaurantOrderCarousel({
  orderGroup,
  t,
}: RestaurantOrderCarouselProps) {
  const orders = orderGroup.orders || []
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  const readyCount = orders.filter((o) => isReady(o.status)).length

  // Scroll to selected slide index smoothly
  const scrollToSlide = useCallback((index: number) => {
    const targetSlide = slideRefs.current[index]
    const container = containerRef.current
    if (targetSlide && container) {
      const targetLeft = targetSlide.offsetLeft - container.offsetLeft
      container.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      })
      setActiveIndex(index)
    }
  }, [])

  // Sync activeIndex on scroll / swipe
  useEffect(() => {
    const container = containerRef.current
    if (!container || orders.length <= 1) return

    const handleScroll = () => {
      const containerLeft = container.scrollLeft

      let closestIndex = 0
      let minDistance = Infinity

      slideRefs.current.forEach((slide, index) => {
        if (!slide) return
        const slideLeft = slide.offsetLeft - container.offsetLeft
        const distance = Math.abs(slideLeft - containerLeft)
        if (distance < minDistance) {
          minDistance = distance
          closestIndex = index
        }
      })

      setActiveIndex(closestIndex)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [orders.length])

  if (orders.length === 0) {
    return null
  }

  // If only 1 order, render without carousel controls
  if (orders.length === 1) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold tracking-tight text-[#2B1B15] sm:text-2xl dark:text-neutral-100">
            {t("orderDetails")}
          </h2>
        </div>
        <RestaurantOrderCard order={orders[0]} t={t} />
      </div>
    )
  }

  return (
    <div className="min-w-0 w-full space-y-4">
      {/* Header section with Title & Ready Counter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1 text-start">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-serif text-xl font-bold tracking-tight text-[#2B1B15] sm:text-2xl dark:text-neutral-100">
              {t("orderDetails")}
            </h2>
            <Badge
              variant="outline"
              className="rounded-full border-[#ECE6DB] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#7C4A27] dark:border-neutral-800 dark:bg-neutral-900 dark:text-[#C2733C]"
            >
              {t("readyCounter", {
                ready: readyCount,
                total: orders.length,
              })}
            </Badge>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollToSlide(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="size-8 rounded-full border-[#ECE6DB] bg-white text-[#4A2E1E] shadow-2xs hover:bg-[#FAF7F2] disabled:opacity-30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label={t("previousOrder")}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <span className="px-1 text-xs font-bold text-[#8C7060] dark:text-neutral-400">
            {activeIndex + 1} / {orders.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollToSlide(Math.min(orders.length - 1, activeIndex + 1))}
            disabled={activeIndex === orders.length - 1}
            className="size-8 rounded-full border-[#ECE6DB] bg-white text-[#4A2E1E] shadow-2xs hover:bg-[#FAF7F2] disabled:opacity-30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label={t("nextOrder")}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      {/* Restaurant Name Bullets / Pill Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {orders.map((order, idx) => {
          const isActive = activeIndex === idx
          const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0)

          return (
            <button
              key={order.orderId}
              type="button"
              onClick={() => scrollToSlide(idx)}
              className={cn(
                "group relative flex shrink-0 items-center gap-2.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C4A27]/40",
                isActive
                  ? "border-[#7C4A27] bg-[#7C4A27] text-white shadow-md shadow-[#7C4A27]/20 dark:border-[#C2733C] dark:bg-[#C2733C] dark:text-neutral-950"
                  : "border-[#ECE6DB] bg-white text-[#523A2D] hover:border-[#D8C8B7] hover:bg-[#FAF7F2] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-850"
              )}
            >
              {/* Status Dot */}
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full ring-2 transition-all duration-200",
                  getStatusDotClass(order.status),
                  isActive ? "ring-white/50" : ""
                )}
                aria-hidden="true"
              />

              {/* Restaurant Icon & Name */}
              <span className="flex items-center gap-1.5 truncate max-w-[160px] sm:max-w-[200px]">
                <Store className={cn("size-3.5 shrink-0", isActive ? "text-white dark:text-neutral-950" : "text-[#7C4A27] dark:text-[#C2733C]")} />
                <span className="truncate">{order.restaurant.name.trim()}</span>
              </span>

              {/* Items Badge */}
              <span
                className={cn(
                  "ms-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold transition-colors",
                  isActive
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-950"
                    : "bg-[#F5EDE5] text-[#7C4A27] dark:bg-neutral-800 dark:text-[#C2733C]"
                )}
              >
                {totalItems}
              </span>
            </button>
          )
        })}
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex min-w-0 w-full snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none gap-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {orders.map((order, idx) => (
          <div
            key={order.orderId}
            ref={(el) => {
              slideRefs.current[idx] = el
            }}
            className="min-w-full w-full shrink-0 snap-start"
          >
            <RestaurantOrderCard order={order} t={t} />
          </div>
        ))}
      </div>
    </div>
  )
}
