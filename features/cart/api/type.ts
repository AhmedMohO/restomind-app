import type { ApiOffer } from "@/features/offers/api/type"

export interface ApiCartItem {
  offer: ApiOffer
  quantity: number
  unitOriginalPrice: number
  unitOfferPrice: number
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
  offerId: string
  quantity: number
}

export interface UpdateCartQuantityPayload {
  quantity: number
}

