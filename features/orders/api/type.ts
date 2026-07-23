import type { ApiRestaurantOrder } from "./dashboard-types"

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"

export interface ApiDeliveryAddress {
  addressId: string
  street: string
  city: string
  country: string
}

export interface ApiRestaurant {
  _id: string
  name: string
}

export interface ApiOrderItem {
  offerId: string
  productId: string
  productTitle: string
  productImage: string
  restaurantId: string
  restaurantName: string
  originalPrice: number
  offerPrice: number
  discountPercentage: number
  quantity: number
  purchasedAt: string
  lineTotal: number
}

export interface ApiOrderGroup {
  orderGroupId: string
  userId: string
  fullName: string
  phoneNumber: string
  emailAddress: string
  deliveryMethod: "Home Delivery" | "Store Pickup"
  deliveryAddress: ApiDeliveryAddress | null
  specialNotes: string
  paymentMethod: "Cash on Delivery" | "Credit / Debit Card"
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  overallStatus: OrderStatus
  orders: ApiRestaurantOrder[]
  createdAt: string
}

/**
 * Payload for POST /orders (create order from active cart).
 * For "Store Pickup" the `deliveryAddress` must be omitted.
 * For "Home Delivery" pass an existing saved address via `deliveryAddress.addressId`.
 */
export interface CreateOrderPayload {
  deliveryMethod: "Home Delivery" | "Store Pickup"
  deliveryAddress?: {
    addressId: string
  }
  specialNotes?: string
  paymentMethod: "Cash on Delivery" | "Credit / Debit Card"
}

// Re-export admin & dashboard order types
export * from "./dashboard-types"
