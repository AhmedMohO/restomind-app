import type {
  ApiDeliveryAddress,
  ApiOrderItem,
  ApiRestaurant,
  OrderStatus,
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

export interface ApiRestaurantOrder {
  _id?: string
  orderId: string
  groupOrderId?: string
  userId?: ApiOrderUser | string
  restaurant: ApiRestaurant
  items: ApiOrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  fullName?: string
  phoneNumber?: string
  emailAddress?: string
  deliveryMethod?: "Home Delivery" | "Store Pickup"
  deliveryAddress?: ApiDeliveryAddress | null
  paymentMethod?: "Cash on Delivery" | "Credit / Debit Card" | string
  status: OrderStatus
  createdAt: string
  updatedAt?: string
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
}

export interface QueryOrderListingParams {
  page?: number
  limit?: number
  search?: string
  status?: OrderStatus
  paymentMethod?: "Cash on Delivery" | "Credit / Debit Card" | string
  deliveryMethod?: "Home Delivery" | "Store Pickup" | string
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

export interface PaginatedAdminOrders {
  data: ApiRestaurantOrder[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
