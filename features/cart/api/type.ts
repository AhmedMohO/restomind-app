import { ApiProduct } from "@/features/products/api/type"
export interface ApiCartItem {
  product: ApiProduct
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
