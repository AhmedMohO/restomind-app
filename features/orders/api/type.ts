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

export interface ApiRestaurantOrder {
  orderId: string
  restaurant: ApiRestaurant
  items: ApiOrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  status: OrderStatus
  createdAt: string
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
  paymentMethod: "Cash on Delivery"
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  overallStatus: OrderStatus
  orders: ApiRestaurantOrder[]
  createdAt: string
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
}
