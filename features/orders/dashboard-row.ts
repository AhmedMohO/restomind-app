/**
 * Normalisation helpers turning the two upstream order listing shapes into the
 * single `DashboardOrderRow` rendered by the dashboard table.
 *
 *   admin           → `GET /orders`                        → ApiOrderGroup
 *   manager / staff → `GET /orders/restaurant/:restaurantId` → ApiRestaurantOrder
 *
 * Pure functions — safe to import from route handlers and components alike.
 */

import type {
  ApiOrderGroup,
  ApiOrderItem,
  ApiRestaurantOrder,
} from "./api/type"
import type { ApiOrderUser, DashboardOrderRow } from "./api/dashboard-types"

const MAX_LISTED_RESTAURANTS = 2

function userFullName(user?: ApiOrderUser | string): string {
  if (!user || typeof user === "string") return ""
  return [user.firstName, user.lastName].filter(Boolean).join(" ")
}

function userContact(user?: ApiOrderUser | string): string {
  if (!user || typeof user === "string") return ""
  return user.email ?? user.phone ?? ""
}

/** "Pizza Co, Burger Hub +2" — keeps wide multi-restaurant groups readable. */
function joinRestaurantNames(names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))]
  if (unique.length === 0) return ""
  if (unique.length <= MAX_LISTED_RESTAURANTS) return unique.join(", ")
  return `${unique.slice(0, MAX_LISTED_RESTAURANTS).join(", ")} +${
    unique.length - MAX_LISTED_RESTAURANTS
  }`
}

function restaurantNamesOf(group: ApiOrderGroup): string[] {
  const fromSubOrders = (group.orders ?? []).map((order) => order.restaurant?.name ?? "")
  if (fromSubOrders.some(Boolean)) return fromSubOrders
  return (group.items ?? []).map((item: ApiOrderItem) => item.restaurantName)
}

export function groupToDashboardRow(group: ApiOrderGroup): DashboardOrderRow {
  const id = group.orderGroupId ?? group.groupOrderId ?? ""
  return {
    id,
    reference: id.slice(-8).toUpperCase(),
    customerName: group.fullName || userFullName(group.userId) || "-",
    customerContact:
      group.emailAddress || group.phoneNumber || userContact(group.userId) || "-",
    restaurantName: joinRestaurantNames(restaurantNamesOf(group)) || "-",
    finalTotalPrice: group.finalTotalPrice,
    totalQuantity: group.totalQuantity,
    deliveryMethod: group.deliveryMethod,
    createdAt: group.createdAt,
  }
}

export function subOrderToDashboardRow(order: ApiRestaurantOrder): DashboardOrderRow {
  const id = order.groupOrderId ?? order._id ?? order.orderId
  return {
    id,
    reference: (order.orderId ?? id).slice(-8).toUpperCase(),
    customerName: order.fullName || userFullName(order.userId) || "-",
    customerContact:
      order.emailAddress || order.phoneNumber || userContact(order.userId) || "-",
    restaurantName:
      order.restaurant?.name || order.items?.[0]?.restaurantName || "-",
    finalTotalPrice: order.finalTotalPrice,
    totalQuantity: order.totalQuantity,
    deliveryMethod: order.deliveryMethod,
    createdAt: order.createdAt,
  }
}
