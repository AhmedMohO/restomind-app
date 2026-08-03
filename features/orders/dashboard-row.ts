/**
 * Normalisation helpers turning the two upstream order listing shapes into the
 * single `DashboardOrderRow` rendered by the dashboard table.
 *
 *   admin           → `GET /orders`                        → ApiOrderGroup
 *   manager / staff → `GET /orders/restaurant/:restaurantId` → ApiRestaurantOrder
 *
 * Pure functions — safe to import from route handlers and components alike.
 */

import type { ApiOrderGroup } from "./api/type"
import type {
  ApiOrderUser,
  ApiRestaurantOrder,
  DashboardOrderRow,
} from "./api/dashboard-types"

const MAX_LISTED_RESTAURANTS = 2

function userFullName(user: ApiOrderUser | null): string {
  if (!user) return ""
  return [user.firstName, user.lastName].filter(Boolean).join(" ")
}

function userContact(user: ApiOrderUser | null): string {
  if (!user) return ""
  return user.email ?? user.phone ?? ""
}

/** "Pizza Co, Burger Hub +2" — keeps wide multi-restaurant groups readable. */
function joinRestaurantNames(names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))]
  if (unique.length === 0) return ""
  if (unique.length <= MAX_LISTED_RESTAURANTS) return unique.join(", ")
  return `${unique.slice(0, MAX_LISTED_RESTAURANTS).join(", ")} +${unique.length - MAX_LISTED_RESTAURANTS
    }`
}

function restaurantNamesOf(group: ApiOrderGroup): string[] {
  return group.orders.map((order) => order.restaurant?.name ?? "")
}

export function groupToDashboardRow(group: ApiOrderGroup): DashboardOrderRow {
  const id = group.groupOrderId
  return {
    id,
    reference: id.slice(-8).toUpperCase(),
    customerName: group.fullName || userFullName(group.user) || "-",
    customerContact:
      group.emailAddress || group.phoneNumber || userContact(group.user) || "-",
    restaurantName: joinRestaurantNames(restaurantNamesOf(group)) || "-",
    finalTotalPrice: group.finalTotalPrice,
    totalQuantity: group.totalQuantity,
    deliveryMethod: group.deliveryMethod,
    createdAt: group.createdAt,
  }
}

export function subOrderToDashboardRow(
  order: ApiRestaurantOrder
): DashboardOrderRow {
  const id = order._id
  return {
    id,
    reference: id.slice(-8).toUpperCase(),
    customerName: order.fullName || userFullName(order.user) || "-",
    customerContact:
      order.emailAddress || order.phoneNumber || userContact(order.user) || "-",
    restaurantName: order.restaurant?.name || "-",
    finalTotalPrice: order.finalTotalPrice,
    totalQuantity: order.totalQuantity,
    deliveryMethod: order.deliveryMethod,
    createdAt: order.createdAt,
  }
}
