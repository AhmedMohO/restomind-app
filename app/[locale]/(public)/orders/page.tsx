"use client"

import React, { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { ClipboardList, ShoppingBag } from "lucide-react"
import { Link } from "@/i18n/routing"
import { MOCK_ORDERS, OrderStatus } from "@/features/orders/data"
import OrderCard from "@/features/orders/OrderCard"
import { cn } from "@/lib/utils"

type FilterStatus = "all" | OrderStatus

export default function OrdersPage() {
  const t = useTranslations("Orders")
  const [activeTab, setActiveTab] = useState<FilterStatus>("all")

  // Filter logic
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") {
      return MOCK_ORDERS
    }
    return MOCK_ORDERS.filter((order) => order.status === activeTab)
  }, [activeTab])

  const tabs: { key: FilterStatus; labelKey: string }[] = [
    { key: "all", labelKey: "statusAll" },
    { key: "pending", labelKey: "statusPending" },
    { key: "out_for_delivery", labelKey: "statusOutForDelivery" },
    { key: "delivered", labelKey: "statusDelivered" },
    { key: "cancelled", labelKey: "statusCancelled" },
  ]

  return (
    <div className="container mx-auto min-h-[70vh] space-y-8 px-4">
      {/* Title Header Section */}

      <h1 className="font-serif text-3xl font-bold tracking-tight text-[#2B1B15] sm:text-4xl dark:text-neutral-100">
        {t("title")}
      </h1>

      {/* Filter Tabs */}
      <div className="dark:scrollbar-thumb-neutral-850 -mx-4 flex scrollbar-thin scrollbar-thumb-neutral-200 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all active:translate-y-px",
                isActive
                  ? "border-[#7C4A27] bg-[#7C4A27] text-white shadow-xs dark:border-[#C2733C] dark:bg-[#C2733C]"
                  : "dark:hover:bg-neutral-850 border-[#ECE6DB] bg-white text-muted-foreground hover:bg-neutral-50 hover:text-foreground dark:border-neutral-800 dark:bg-neutral-900 dark:hover:text-neutral-200"
              )}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length > 0 ? (
        <div className="flex flex-col gap-6 pt-2 pl-1 md:pl-2">
          {filteredOrders.map((order, idx) => (
            <OrderCard
              key={order.id}
              order={order}
              isFirst={idx === 0}
              isLast={idx === filteredOrders.length - 1}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex animate-in flex-col items-center justify-center space-y-5 rounded-[24px] border border-dashed border-[#ECE6DB] bg-white p-8 py-16 text-center duration-300 fade-in dark:border-neutral-800 dark:bg-neutral-900">
          <div className="dark:bg-neutral-850 rounded-full bg-[#FAF2ED] p-5 text-[#7C4A27] transition-colors dark:text-[#E68A49]">
            <ClipboardList size={44} className="stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
              {t("empty")}
            </h3>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {t("emptyDesc")}
            </p>
          </div>
          <Link
            href="/offers"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#7C4A27] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
          >
            <ShoppingBag className="mr-1.5 size-3.5 rtl:mr-0 rtl:ml-1.5" />
            <span>{t("statusAll")}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
