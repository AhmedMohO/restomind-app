import type { ApiOrderUser, ApiRestaurantOrder } from "./dashboard-types"

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"

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
  /** Alias returned by some endpoints (`GET /orders`, `GET /orders/me`). */
  groupOrderId?: string
  userId: string | ApiOrderUser
  fullName: string
  phoneNumber: string
  emailAddress: string
  deliveryMethod: DeliveryMethod
  deliveryAddress: ApiDeliveryAddress | null
  specialNotes: string
  paymentMethod: PaymentMethod
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  overallStatus: OrderStatus
  /** Restaurant sub-orders. Flat listings omit it — always guard with `?? []`. */
  orders: ApiRestaurantOrder[]
  /** Flattened line items returned by the listing endpoints. */
  items?: ApiOrderItem[]
  createdAt: string
  updatedAt?: string
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
