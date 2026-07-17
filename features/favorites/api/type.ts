import type { ApiProduct } from "@/features/products/api/type"

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
  data: ApiProduct[]
}
