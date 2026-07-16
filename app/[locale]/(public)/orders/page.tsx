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
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8 min-h-[70vh]">
      {/* Title Header Section */}
      <div className="bg-white border border-[#ECE6DB] rounded-[24px] p-6 sm:p-8 space-y-2 dark:bg-neutral-900 dark:border-neutral-800 transition-colors shadow-xs">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1B15] dark:text-neutral-100">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-850">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-full border transition-all whitespace-nowrap active:translate-y-px",
                isActive
                  ? "bg-[#7C4A27] text-white border-[#7C4A27] dark:bg-[#C2733C] dark:border-[#C2733C] shadow-xs"
                  : "bg-white border-[#ECE6DB] text-muted-foreground hover:bg-neutral-50 hover:text-foreground dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-850 dark:hover:text-neutral-200"
              )}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length > 0 ? (
        <div className="flex flex-col gap-6 pl-1 md:pl-2 pt-2">
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
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#ECE6DB] rounded-[24px] bg-white dark:bg-neutral-900 dark:border-neutral-800 p-8 space-y-5 animate-in fade-in duration-300">
          <div className="bg-[#FAF2ED] dark:bg-neutral-850 p-5 rounded-full text-[#7C4A27] dark:text-[#E68A49] transition-colors">
            <ClipboardList size={44} className="stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-[#2B1B15] dark:text-neutral-100">
              {t("empty")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              {t("emptyDesc")}
            </p>
          </div>
          <Link
            href="/offers"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#7C4A27] text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432] text-xs font-semibold px-6 transition-all shadow-sm"
          >
            <ShoppingBag className="size-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{t("statusAll")}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
