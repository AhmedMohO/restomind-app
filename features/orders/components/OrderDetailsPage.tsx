"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import OrderHeader from "@/features/orders/components/OrderHeader"
import RestaurantOrderCarousel from "@/features/orders/components/RestaurantOrderCarousel"
import SharedInfoPanel from "@/features/orders/components/SharedInfoPanel"
import type {
  ApiOrderGroup,
  ApiRestaurantOrder,
} from "@/features/orders/api/type"

interface OrderDetailsPageProps {
  orderGroup: ApiOrderGroup
  locale: string
  /**
   * Renders a status control inside each restaurant card. Omitted on the
   * customer screen (read only), provided on the dashboard where admins,
   * managers and staff can advance an order.
   */
  renderStatusControl?: (order: ApiRestaurantOrder) => ReactNode
}

/**
 * Shared order details layout — header, per-restaurant carousel and the shared
 * customer/fulfilment panel. Groups with a single restaurant (what managers and
 * staff see) render as a plain card without carousel controls.
 */
export default function OrderDetailsPage({
  orderGroup,
  locale,
  renderStatusControl,
}: OrderDetailsPageProps) {
  const t = useTranslations("Orders")
  // Some listing endpoints omit `createdAt`; never hand an invalid date to Intl.
  const createdAt = new Date(orderGroup.createdAt ?? "")
  const formattedDate = Number.isNaN(createdAt.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(createdAt)

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
          <RestaurantOrderCarousel
            orderGroup={orderGroup}
            t={t}
            renderStatusControl={renderStatusControl}
          />
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
