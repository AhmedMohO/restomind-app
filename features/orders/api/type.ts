// ─── Order Status ────────────────────────────────────────────────────────────
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"

// ─── Sub-Schemas (matching API docs exactly) ─────────────────────────────────

export interface ApiOrderItem {
  productId: string
  title: string
  price: number
  discountedPrice: number
  quantity: number
}

export interface ApiDeliveryAddress {
  addressId?: string
  street: string
  city: string
  country: string
}

/** Populated Restaurant object (restaurantId is populated in GET /orders/me) */
export interface ApiRestaurant {
  _id: string
  name: string
  ownerUserId: string
  description?: string
  logoUrl?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    country?: string
  }
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// ─── Main Order Schema ────────────────────────────────────────────────────────

export interface ApiOrder {
  _id: string
  userId: string
  /** The restaurant is populated as a full object in the GET /orders/me response */
  restaurantId: ApiRestaurant
  items: ApiOrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  fullName: string
  phoneNumber: string
  emailAddress: string
  deliveryMethod: "Home Delivery" | "Store Pickup"
  deliveryAddress?: ApiDeliveryAddress
  specialNotes?: string
  paymentMethod: "Cash on Delivery"
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface UpdateOrderStatusPayload {
  status: OrderStatus
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
  paymentMethod: "Cash on Delivery"
}
