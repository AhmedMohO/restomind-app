"use client"

import { useTranslations } from "next-intl"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import OrderDetailsPanel from "@/features/orders/OrderDetailsPanel"
import type { ApiOrderGroup } from "@/features/orders/api/type"

interface OrderDetailsSwiperProps {
  orderGroup: ApiOrderGroup
}

export default function OrderDetailsSwiper({
  orderGroup,
}: OrderDetailsSwiperProps) {
  const t = useTranslations("Orders")

  if (orderGroup.orders.length === 0) {
    return null
  }

  return (
    <Carousel className="w-full">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1 text-start">
          <h2 className="font-serif text-xl font-bold tracking-tight text-[#2B1B15] sm:text-2xl dark:text-neutral-100">
            {t("orderDetails")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {orderGroup.orders.map((order, index) => (
              <Badge
                key={order.orderId}
                variant="outline"
                className="rounded-full border-[#ECE6DB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6B4C3B] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                {index + 1}. {order.restaurant.name.trim()}
              </Badge>
            ))}
          </div>
        </div>

        <div className="relative flex h-9 w-20 shrink-0 items-center gap-2 self-end sm:self-auto">
          <CarouselPrevious
            aria-label={t("previousOrder")}
            className="relative top-0 right-0 left-0 flex size-9 translate-y-0"
          />
          <CarouselNext
            aria-label={t("nextOrder")}
            className="relative top-0 right-0 left-0 flex size-9 translate-y-0"
          />
        </div>
      </div>

      <CarouselContent className="flex gap-4 pb-2">
        {orderGroup.orders.map((order) => (
          <CarouselItem
            key={order.orderId}
            className="w-full basis-full sm:basis-[min(92%,56rem)] lg:basis-[min(88%,64rem)]"
          >
            <OrderDetailsPanel order={order} orderGroup={orderGroup} t={t} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
