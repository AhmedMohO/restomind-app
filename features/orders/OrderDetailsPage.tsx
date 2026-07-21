"use client"

import { useTranslations } from "next-intl"
import OrderHeader from "@/features/orders/OrderHeader"
import RestaurantTabs from "@/features/orders/RestaurantTabs"
import SharedInfoPanel from "@/features/orders/SharedInfoPanel"
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

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <RestaurantTabs orderGroup={orderGroup} t={t} />
        <SharedInfoPanel
          orderGroup={orderGroup}
          t={t}
          className="lg:sticky lg:top-24"
        />
      </div>
    </>
  )
}
