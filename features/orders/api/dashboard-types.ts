import type {
  ApiDeliveryAddress,
  ApiRestaurant,
  DeliveryMethod,
  OrderStatus,
  PaginatedResponse,
  PaymentMethod,
} from "./type"

export interface ApiOrderUser {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  gender?: string
  phone?: string
  isEmailVerified?: boolean
  DOB?: string
  isDeleted?: boolean
  addresses?: unknown[]
  createdAt?: string
  updatedAt?: string
  id?: string
}

/** Line item as returned inside a standalone restaurant order. */
export interface ApiChildOrderItem {
  productId: string
  productTitle: string
  productImage?: string
  offerId?: string
  restaurantId: string
  restaurantName: string
  originalPrice: number
  offerPrice: number
  discountPercentage: number
  quantity: number
  lineTotal: number
  purchasedAt: string
}

/**
 * A standalone restaurant order — `GET /orders/:id`, the response of
 * `PATCH /orders/:id/status`, and the manager/staff listing branch of
 * `GET /orders`. Distinct from `ApiGroupSubOrder`, which is the slimmer shape
 * nested inside `ApiOrderGroup.orders[]`.
 */
export interface ApiRestaurantOrder {
  _id: string
  groupOrderId?: string
  user: ApiOrderUser | null
  restaurant: ApiRestaurant
  items: ApiChildOrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  fullName: string
  phoneNumber: string
  emailAddress: string
  deliveryMethod: DeliveryMethod
  deliveryAddress: ApiDeliveryAddress | null
  specialNotes?: string
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
}

export interface QueryOrderListingParams {
  page?: number
  limit?: number
  search?: string
  status?: OrderStatus
  paymentMethod?: PaymentMethod | string
  deliveryMethod?: DeliveryMethod | string
  startDate?: string
  endDate?: string
  minTotalPrice?: number
  maxTotalPrice?: number
  restaurantId?: string
  sortBy?: string
  sort?: string
  sortOrder?: "asc" | "desc"
  order?: "asc" | "desc"
}

/**
 * Row shape rendered by the dashboard orders table.
 *
 * Admins list aggregated group orders (`GET /orders`) while managers and staff
 * list their own restaurant's sub-orders (`GET /orders/restaurant/:id`). Both
 * upstream shapes are normalised into this single row server-side so the table
 * stays role-agnostic.
 */
export interface DashboardOrderRow {
  /** Identifier used to open the details page (group id when available). */
  id: string
  /** Short reference displayed in the table. */
  reference: string
  customerName: string
  customerContact: string
  restaurantName: string
  finalTotalPrice: number
  totalQuantity: number
  deliveryMethod?: DeliveryMethod
  createdAt: string
}

export type PaginatedDashboardOrders = PaginatedResponse<DashboardOrderRow>

/** Aggregated completion counters shown above the dashboard orders table. */
export interface DashboardOrdersSummary {
  /** Orders matching the active filters. */
  total: number
  /** Orders among them that reached the terminal `Delivered` status. */
  done: number
}
