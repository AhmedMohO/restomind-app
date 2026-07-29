import { CheckCircle2, Clock, Truck, XCircle } from "lucide-react"
import type {
  ApiPurchaseOrder,
  ApiPurchaseOrderItem,
  IngredientDetails,
  PurchaseOrderStatus,
  SupplierDetails,
  UserDetails,
} from "./types"

/**
 * Normalizes supplier info from PO into a clean SupplierDetails object
 */
export function getSupplierDetails(
  supplier: ApiPurchaseOrder["supplierId"]
): SupplierDetails {
  if (!supplier) return { name: "-" }
  if (typeof supplier === "string") return { name: supplier }
  return {
    name: supplier.name || "-",
    phone: supplier.phone,
    email: supplier.email,
  }
}

/**
 * Returns supplier name as a string
 */
export function getSupplierName(
  supplier: ApiPurchaseOrder["supplierId"]
): string {
  if (!supplier) return "-"
  return typeof supplier === "string" ? supplier : supplier.name || "-"
}

/**
 * Normalizes creator/user info from PO into UserDetails
 */
export function getUserDetails(
  user: ApiPurchaseOrder["createdBy"]
): UserDetails {
  if (!user) return { name: "-" }
  if (typeof user === "string") return { name: user }
  return {
    name: user.name || user.email || "-",
    email: user.email,
  }
}

/**
 * Normalizes ingredient info from PO item into IngredientDetails
 */
export function getIngredientDetails(
  ingredient: ApiPurchaseOrderItem["ingredientId"]
): IngredientDetails {
  if (!ingredient) return { name: "-" }
  if (typeof ingredient === "string") return { name: ingredient }
  return {
    name: ingredient.name || "-",
    code: ingredient.ingredientCode,
    unit: ingredient.unit,
  }
}

import { roundPrice } from "@/lib/utils"

/**
 * Calculates the total monetary cost for a PO or list of items
 */
export function calculateOrderTotal(
  itemsOrPo: ApiPurchaseOrder | ApiPurchaseOrderItem[] | null | undefined
): number {
  if (!itemsOrPo) return 0
  const items = Array.isArray(itemsOrPo) ? itemsOrPo : itemsOrPo.items
  if (!items || !Array.isArray(items)) return 0
  const total = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0),
    0
  )
  return roundPrice(total)
}

/**
 * Returns status badge UI configuration (icon, styles, colors, and label)
 */
export function getStatusConfig(
  poStatus: PurchaseOrderStatus,
  t: (key: string) => string
) {
  switch (poStatus) {
    case "draft":
      return {
        label: t("statusDraft"),
        icon: Clock,
        styles:
          "border-amber-200/90 bg-amber-500/10 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300",
        iconColor: "text-amber-600 dark:text-amber-400",
      }
    case "sent":
      return {
        label: t("statusSent"),
        icon: Truck,
        styles:
          "border-sky-200/90 bg-sky-500/10 text-sky-700 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300",
        iconColor: "text-sky-600 dark:text-sky-400",
      }
    case "received":
      return {
        label: t("statusReceived"),
        icon: CheckCircle2,
        styles:
          "border-emerald-200/90 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300",
        iconColor: "text-emerald-600 dark:text-emerald-400",
      }
    case "cancelled":
      return {
        label: t("statusCancelled"),
        icon: XCircle,
        styles:
          "border-rose-200/90 bg-rose-500/10 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300",
        iconColor: "text-rose-600 dark:text-rose-400",
      }
    default:
      return {
        label: poStatus,
        icon: Clock,
        styles: "border-border bg-muted text-foreground",
        iconColor: "text-muted-foreground",
      }
  }
}
