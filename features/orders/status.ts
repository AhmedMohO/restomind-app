import type React from "react"
import { Clock, CheckCircle2, ChefHat, Truck, XCircle } from "lucide-react"
import type { OrderStatus } from "./api/type"

export interface StatusMeta {
  Icon: React.ElementType
  bg: string
  badgeClass: string
  labelKey: string
}

export const STATUS_ORDER: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out For Delivery",
  "Delivered",
]

export function getStatusMeta(status: OrderStatus): StatusMeta {
  switch (status) {
    case "Pending":
      return {
        Icon: Clock,
        bg: "bg-amber-500 text-white",
        badgeClass:
          "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
        labelKey: "statusPending",
      }
    case "Confirmed":
      return {
        Icon: CheckCircle2,
        bg: "bg-[#2E7D4F] text-white",
        badgeClass:
          "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
        labelKey: "statusConfirmed",
      }
    case "Preparing":
      return {
        Icon: ChefHat,
        bg: "bg-orange-500 text-white",
        badgeClass:
          "bg-orange-50 text-orange-800 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/60",
        labelKey: "statusPreparing",
      }
    case "Out For Delivery":
      return {
        Icon: Truck,
        bg: "bg-sky-500 text-white",
        badgeClass:
          "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60",
        labelKey: "statusOutForDelivery",
      }
    case "Delivered":
      return {
        Icon: CheckCircle2,
        bg: "bg-[#2E7D4F] text-white",
        badgeClass:
          "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
        labelKey: "statusDelivered",
      }
    case "Cancelled":
      return {
        Icon: XCircle,
        bg: "bg-rose-500 text-white",
        badgeClass:
          "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
        labelKey: "statusCancelled",
      }
  }
}
