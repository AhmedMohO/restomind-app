"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RestaurantOrderCard from "@/features/orders/RestaurantOrderCard"
import type { ApiOrderGroup, OrderStatus } from "@/features/orders/api/type"
import { cn } from "@/lib/utils"

interface RestaurantTabsProps {
  orderGroup: ApiOrderGroup
  t: (key: string, values?: Record<string, string | number>) => string
}

function getStatusDotClass(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return "bg-amber-500"
    case "Preparing":
    case "Confirmed":
    case "Out For Delivery":
      return "bg-blue-500"
    case "Ready":
      return "bg-green-500"
    case "Delivered":
      return "bg-gray-400"
    case "Cancelled":
      return "bg-rose-500"
  }
}

function isReady(status: OrderStatus) {
  return status === "Ready"
}

export default function RestaurantTabs({ orderGroup, t }: RestaurantTabsProps) {
  const [firstOrder] = orderGroup.orders
  const readyCount = orderGroup.orders.filter((order) =>
    isReady(order.status)
  ).length

  if (!firstOrder) {
    return null
  }

  if (orderGroup.orders.length === 1) {
    return <RestaurantOrderCard order={firstOrder} t={t} />
  }

  return (
    <Tabs defaultValue={firstOrder.orderId} className="w-full gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1 text-start">
          <h2 className="font-serif text-xl font-bold tracking-tight text-[#2B1B15] sm:text-2xl dark:text-neutral-100">
            {t("orderDetails")}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <TabsList
              variant="line"
              className="h-auto flex-wrap justify-start gap-1 p-0"
            >
              {orderGroup.orders.map((order) => (
                <TabsTrigger
                  key={order.orderId}
                  value={order.orderId}
                  className="h-8 flex-none rounded-full border-[#ECE6DB] bg-white px-3 py-1 text-[11px] font-semibold text-[#6B4C3B] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 data-active:border-[#D8C8B7] data-active:bg-[#FAF7F2] dark:data-active:border-neutral-700"
                >
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      getStatusDotClass(order.status)
                    )}
                    aria-hidden="true"
                  />
                  <span className="max-w-36 truncate">
                    {order.restaurant.name.trim()}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <Badge
              variant="outline"
              className="h-7 rounded-full border-[#ECE6DB] bg-white px-3 text-sm font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900"
            >
              {t("readyCounter", {
                ready: readyCount,
                total: orderGroup.orders.length,
              })}
            </Badge>
          </div>
        </div>
      </div>

      {orderGroup.orders.map((order) => (
        <TabsContent key={order.orderId} value={order.orderId} className="mt-0">
          <RestaurantOrderCard order={order} t={t} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
