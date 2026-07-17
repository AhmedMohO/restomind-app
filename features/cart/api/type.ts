import type { ApiImage } from "@/features/users/api/type"

export interface CartItemProduct {
  _id: string
  title: string
  description: string
  price: number
  discountedPrice: number
  image: ApiImage
  isAvailable: boolean
}

export interface ApiCartItem {
  product: CartItemProduct
  quantity: number
  unitPrice: number
  discountedPrice: number
  totalItemPrice: number
}

export interface ApiCart {
  _id: string
  userId: string
  items: ApiCartItem[]
  totalQuantity: number
  totalOriginalPrice: number
  totalDiscount: number
  finalTotalPrice: number
}

export interface AddToCartPayload {
  productId: string
  quantity: number
}

export interface UpdateCartQuantityPayload {
  quantity: number
}
