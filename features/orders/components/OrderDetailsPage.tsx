"use client"

import { useTranslations } from "next-intl"
import OrderHeader from "@/features/orders/components/OrderHeader"
import RestaurantOrderCarousel from "@/features/orders/components/RestaurantOrderCarousel"
import SharedInfoPanel from "@/features/orders/components/SharedInfoPanel"
import type { ApiOrderGroup } from "@/features/orders/api/type"

interface OrderDetailsPageProps {
  orderGroup: ApiOrderGroup
  locale: string
}

export default function OrderDetailsPage({
  orderGroup,
  locale,
}: OrderDetailsPageProps) {
  const t = useTranslations("Orders")
  const formattedDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(orderGroup.createdAt))

  return (
    <>
      <OrderHeader
        orderGroup={orderGroup}
        formattedDate={formattedDate}
        t={t}
      />
      <SharedInfoPanel orderGroup={orderGroup} t={t} mobile />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <RestaurantOrderCarousel orderGroup={orderGroup} t={t} />
        </div>
        <SharedInfoPanel
          orderGroup={orderGroup}
          t={t}
          className="lg:sticky lg:top-4"
        />
      </div>
    </>
  )
}
