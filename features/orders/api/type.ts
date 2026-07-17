export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"

export interface OrderItem {
  productId: string
  title: string
  price: number
  discountedPrice: number
  quantity: number
}

export interface ApiOrder {
  _id: string
  userId: string
  items: OrderItem[]
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
  totalQuantity: number
  paymentMethod: "CASH"
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
}
