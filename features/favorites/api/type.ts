import { ApiOffer } from "@/features/offers/api"

export interface ApiFavorite {
  _id: string
  userId: string
  productId: string
  createdAt: string
  updatedAt: string
}

export interface FavoriteStatusResponse {
  isFavorite: boolean
}

export type FavoritesListResponse = {
  offers: ApiOffer[]
}
