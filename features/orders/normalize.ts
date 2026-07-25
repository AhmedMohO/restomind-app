/**
 * Normalisation of the orders API payloads.
 *
 * The backend returns three different shapes for the same domain objects and
 * none of them matches one-to-one what the UI renders:
 *
 *   `GET /orders`, `GET /orders/group/:id`   → group id as `groupOrderId`/`_id`,
 *       a *flat* `items[]`, no `orders[]` and no `createdAt` (only `updatedAt`).
 *   `GET /orders/me`, `GET /orders/me/:id`   → group id as `groupOrderId`/`_id`,
 *       `orders[]` whose items use the legacy `{title, price, discountedPrice}`
 *       naming instead of `{productTitle, originalPrice, offerPrice, lineTotal}`.
 *   `GET /orders/restaurant/:id`             → raw sub-order documents, whose id
 *       is `_id` rather than `orderId`.
 *
 * Everything is converted here, at the single API boundary, so components and
 * mappers downstream only ever see the canonical `ApiOrderGroup` /
 * `ApiRestaurantOrder` types.
 */

import type {
  ApiOrderGroup,
  ApiOrderItem,
  ApiRestaurantOrder,
  OrderStatus,
} from "./api/type"

type Raw = Record<string, unknown>

function asRecord(value: unknown): Raw {
  return value && typeof value === "object" ? (value as Raw) : {}
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return fallback
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === "string" ? Number(value) : value
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback
}

/** Mongo ids arrive either as a string or as a populated `{ _id }` document. */
function id(value: unknown): string {
  if (typeof value === "string") return value
  const record = asRecord(value)
  return str(record._id ?? record.id)
}

/** First non-empty id among the candidates. */
function firstId(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const value = id(candidate)
    if (value) return value
  }
  return ""
}

function normalizeItem(raw: unknown, fallback: {
  restaurantId?: string
  restaurantName?: string
  purchasedAt?: string
}): ApiOrderItem {
  const item = asRecord(raw)
  const originalPrice = num(item.originalPrice ?? item.price)
  const offerPrice = num(item.offerPrice ?? item.discountedPrice)
  const quantity = num(item.quantity, 1)

  return {
    offerId: id(item.offerId),
    productId: id(item.productId),
    productTitle: str(item.productTitle ?? item.title),
    productImage: str(item.productImage ?? item.image),
    restaurantId: id(item.restaurantId) || fallback.restaurantId || "",
    restaurantName: str(item.restaurantName, fallback.restaurantName ?? ""),
    originalPrice,
    offerPrice,
    discountPercentage: num(item.discountPercentage),
    quantity,
    purchasedAt: str(item.purchasedAt, fallback.purchasedAt ?? ""),
    lineTotal: num(item.lineTotal, offerPrice * quantity),
  }
}

interface SubOrderContext {
  groupOrderId?: string
  createdAt?: string
  status?: OrderStatus
}

export function normalizeRestaurantOrder(
  raw: unknown,
  context: SubOrderContext = {}
): ApiRestaurantOrder {
  const order = asRecord(raw)
  const restaurant = asRecord(order.restaurant ?? order.restaurantId)
  const restaurantId = firstId(order.restaurant, order.restaurantId)
  const restaurantName = str(restaurant.name ?? restaurant.title ?? order.restaurantName)
  const createdAt = str(order.createdAt, context.createdAt ?? "")

  const items = Array.isArray(order.items)
    ? order.items.map((item) =>
        normalizeItem(item, {
          restaurantId,
          restaurantName,
          purchasedAt: createdAt,
        })
      )
    : []

  const totalOriginalPrice = num(
    order.totalOriginalPrice,
    items.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0)
  )
  const finalTotalPrice = num(
    order.finalTotalPrice,
    items.reduce((acc, item) => acc + item.lineTotal, 0)
  )

  return {
    _id: firstId(order._id, order.orderId),
    orderId: firstId(order.orderId, order._id),
    groupOrderId: firstId(order.groupOrderId, order.orderGroupId) || context.groupOrderId,
    userId: order.userId as ApiRestaurantOrder["userId"],
    restaurant: { _id: restaurantId, name: restaurantName },
    items,
    totalOriginalPrice,
    totalDiscount: num(
      order.totalDiscount,
      Math.max(0, totalOriginalPrice - finalTotalPrice)
    ),
    finalTotalPrice,
    totalQuantity: num(
      order.totalQuantity,
      items.reduce((acc, item) => acc + item.quantity, 0)
    ),
    fullName: str(order.fullName) || undefined,
    phoneNumber: str(order.phoneNumber) || undefined,
    emailAddress: str(order.emailAddress) || undefined,
    deliveryMethod: order.deliveryMethod as ApiRestaurantOrder["deliveryMethod"],
    deliveryAddress:
      (order.deliveryAddress as ApiRestaurantOrder["deliveryAddress"]) ?? null,
    paymentMethod: order.paymentMethod as ApiRestaurantOrder["paymentMethod"],
    status: (str(order.status) || context.status || "Pending") as OrderStatus,
    createdAt,
    updatedAt: str(order.updatedAt) || undefined,
  }
}

/**
 * Rebuilds per-restaurant sub-orders from a flat `items[]`.
 *
 * `GET /orders` and `GET /orders/group/:id` drop the sub-orders entirely, so a
 * placeholder card per restaurant is derived from the items. These carry no
 * sub-order id — the caller (dashboard) refetches the real sub-orders when it
 * needs to update a status.
 */
function subOrdersFromItems(
  items: ApiOrderItem[],
  context: SubOrderContext
): ApiRestaurantOrder[] {
  const byRestaurant = new Map<string, ApiOrderItem[]>()
  for (const item of items) {
    const key = item.restaurantId || item.restaurantName
    byRestaurant.set(key, [...(byRestaurant.get(key) ?? []), item])
  }

  return [...byRestaurant.entries()].map(([restaurantId, restaurantItems]) =>
    normalizeRestaurantOrder(
      {
        _id: "",
        orderId: context.groupOrderId ?? "",
        restaurant: {
          _id: restaurantId,
          name: restaurantItems[0]?.restaurantName ?? "",
        },
        items: restaurantItems,
        status: context.status,
      },
      context
    )
  )
}

export function normalizeOrderGroup(raw: unknown): ApiOrderGroup {
  const group = asRecord(raw)
  const orderGroupId = firstId(group.orderGroupId, group.groupOrderId, group._id)
  // The group endpoints only expose `updatedAt`; fall back so date formatting
  // never receives an invalid value.
  const createdAt = str(group.createdAt, str(group.updatedAt))
  const overallStatus = (str(group.overallStatus) || "Pending") as OrderStatus

  const flatItems = Array.isArray(group.items)
    ? group.items.map((item) => normalizeItem(item, { purchasedAt: createdAt }))
    : []

  const rawOrders = Array.isArray(group.orders)
    ? group.orders
    : Array.isArray(group.orderIds)
      ? group.orderIds
      : []

  const orders = rawOrders.length
    ? rawOrders.map((order) =>
        normalizeRestaurantOrder(order, {
          groupOrderId: orderGroupId,
          createdAt,
          status: overallStatus,
        })
      )
    : subOrdersFromItems(flatItems, {
        groupOrderId: orderGroupId,
        createdAt,
        status: overallStatus,
      })

  const items = flatItems.length
    ? flatItems
    : orders.flatMap((order) => order.items)

  const sum = (key: "totalOriginalPrice" | "totalDiscount" | "finalTotalPrice" | "totalQuantity") =>
    orders.reduce((acc, order) => acc + order[key], 0)

  return {
    orderGroupId,
    groupOrderId: orderGroupId,
    userId: (group.userId as ApiOrderGroup["userId"]) ?? "",
    fullName: str(group.fullName),
    phoneNumber: str(group.phoneNumber),
    emailAddress: str(group.emailAddress),
    deliveryMethod:
      (group.deliveryMethod as ApiOrderGroup["deliveryMethod"]) ?? "Home Delivery",
    deliveryAddress:
      (group.deliveryAddress as ApiOrderGroup["deliveryAddress"]) ?? null,
    specialNotes: str(group.specialNotes),
    paymentMethod:
      (group.paymentMethod as ApiOrderGroup["paymentMethod"]) ?? "Cash on Delivery",
    totalOriginalPrice: num(group.totalOriginalPrice, sum("totalOriginalPrice")),
    totalDiscount: num(group.totalDiscount, sum("totalDiscount")),
    finalTotalPrice: num(group.finalTotalPrice, sum("finalTotalPrice")),
    totalQuantity: num(group.totalQuantity, sum("totalQuantity")),
    overallStatus,
    orders,
    items,
    createdAt,
    updatedAt: str(group.updatedAt) || undefined,
  }
}
