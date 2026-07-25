import type React from "react"
import { Clock, CheckCircle2, ChefHat, Truck, XCircle } from "lucide-react"
import type { OrderStatus } from "./api/type"

export interface StatusMeta {
  Icon: React.ElementType
  bg: string
  badgeClass: string
  labelKey: string
}

/** Lifecycle order of a healthy (non-cancelled) order. */
export const STATUS_ORDER: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Out For Delivery",
  "Delivered",
]

/** Every selectable/filterable status — single source of truth for the UI. */
export const ORDER_STATUSES: OrderStatus[] = [...STATUS_ORDER, "Cancelled"]

export function getStatusMeta(status?: OrderStatus | string | null): StatusMeta {
  if (!status) {
    return {
      Icon: Clock,
      bg: "bg-amber-500 text-white",
      badgeClass:
        "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
      labelKey: "statusPending",
    }
  }

  const normalized = String(status).trim().toLowerCase().replace(/_/g, " ")

  switch (normalized) {
    case "pending":
      return {
        Icon: Clock,
        bg: "bg-amber-500 text-white",
        badgeClass:
          "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
        labelKey: "statusPending",
      }
    case "confirmed":
      return {
        Icon: CheckCircle2,
        bg: "bg-[#2E7D4F] text-white",
        badgeClass:
          "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
        labelKey: "statusConfirmed",
      }
    case "preparing":
      return {
        Icon: ChefHat,
        bg: "bg-blue-500 text-white",
        badgeClass:
          "bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
        labelKey: "statusPreparing",
      }
    case "ready":
      return {
        Icon: CheckCircle2,
        bg: "bg-green-500 text-white",
        badgeClass:
          "bg-green-50 text-green-800 border-green-200/80 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/60",
        labelKey: "statusReady",
      }
    case "out for delivery":
      return {
        Icon: Truck,
        bg: "bg-sky-500 text-white",
        badgeClass:
          "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60",
        labelKey: "statusOutForDelivery",
      }
    case "delivered":
      return {
        Icon: CheckCircle2,
        bg: "bg-gray-500 text-white",
        badgeClass:
          "bg-gray-50 text-gray-700 border-gray-200/80 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700",
        labelKey: "statusDelivered",
      }
    case "cancelled":
    case "canceled":
      return {
        Icon: XCircle,
        bg: "bg-rose-500 text-white",
        badgeClass:
          "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
        labelKey: "statusCancelled",
      }
    default:
      return {
        Icon: Clock,
        bg: "bg-amber-500 text-white",
        badgeClass:
          "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
        labelKey: "statusPending",
      }
  }
}
