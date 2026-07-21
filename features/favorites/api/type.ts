import type { ApiOffer } from "@/features/offers/api"

export interface ApiFavorite {
  _id: string
  userId: string
  offerId: string | ApiOffer
  createdAt: string
  updatedAt: string
}

export interface FavoriteStatusResponse {
  isFavorite: boolean
}

export type FavoritesListResponse = {
  data: ApiOffer[]
}
