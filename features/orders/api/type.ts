import type { ApiOrderUser } from "./dashboard-types"

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"

/** Aggregate status shown on a group when its sub-orders don't all match. */
export type OverallOrderStatus =
  | OrderStatus
  | "Partially Delivered"
  | "Partially Cancelled"
  | "Processing"

/** Fulfilment method supported by the orders API. */
export type DeliveryMethod = "Home Delivery" | "Store Pickup"

/** Payment methods returned by the API (only COD can be submitted today). */
export type PaymentMethod = "Cash on Delivery" | "Credit / Debit Card"

export interface ApiDeliveryAddress {
  addressId?: string
  street: string
  city: string
  country: string
}

/** Paginated wrapper returned by every listing endpoint of the orders module. */
export interface PaginatedResponse<T> {
  data: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ApiRestaurant {
  _id: string
  name: string
  logo?: string
  image?: string
}

/** Line item as returned inside a group's per-restaurant sub-order. */
export interface ApiOrderItem {
  productId: string
  title: string
  price: number
  discountedPrice: number
  quantity: number
  lineTotal: number
  offerId?: string
  discountPercentage?: number
  productImage?: string
}

/** A group's sub-order for one restaurant — `ApiOrderGroup.orders[]`. */
export interface ApiGroupSubOrder {
  orderId: string
  restaurant: ApiRestaurant
  status: OrderStatus
  items: ApiOrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  createdAt: string
}

export interface ApiOrderGroup {
  _id: string
  groupOrderId: string
  user: ApiOrderUser | null
  fullName: string
  phoneNumber: string
  emailAddress: string
  deliveryMethod: DeliveryMethod
  deliveryAddress: ApiDeliveryAddress | null
  specialNotes?: string
  paymentMethod: PaymentMethod
  overallStatus: OverallOrderStatus
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  orders: ApiGroupSubOrder[]
  createdAt: string
  updatedAt: string
}

/**
 * Delivery address accepted by POST /orders — either a reference to a saved
 * address (`addressId`) or the raw fields (optionally persisted via
 * `saveAddress`). See API docs §9.1.
 */
export interface CreateOrderAddress {
  addressId?: string
  street?: string
  city?: string
  country?: string
}

/**
 * Payload for POST /orders (create order from active cart).
 * Contact details (name, phone, email) are injected server-side from the
 * authenticated profile. `deliveryAddress` must be omitted for "Store Pickup".
 */
export interface CreateOrderPayload {
  deliveryMethod: DeliveryMethod
  deliveryAddress?: CreateOrderAddress
  specialNotes?: string
  paymentMethod: Extract<PaymentMethod, "Cash on Delivery">
  /** Persist a raw address to the customer's saved addresses. */
  saveAddress?: boolean
}

// Re-export admin & dashboard order types
export * from "./dashboard-types"
