import type { ApiCategory } from "@/features/categories/api/type"
import type { Restaurant } from "@/features/restaurant/types"
import type { ApiImage } from "@/features/users/api/type"

export interface ApiProduct {
  _id: string
  title: string
  slug: string
  description: string
  longDescription: string
  price: number
  discountedPrice?: number
  rating: number
  reviewsCount: number
  isBestseller: boolean
  isAvailable: boolean
  image: ApiImage
  category: ApiCategory
  restaurantId: Pick<Restaurant, "_id" | "name"> | string
  freshnessWindow: number
  tags: string[]
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedProducts {
  items: ApiProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetProductsParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  tag?: string
  sort?: string
  order?: "asc" | "desc"
  restaurantId?: string
}

export interface ProductFormPayload {
  title?: string
  description?: string
  longDescription?: string
  price?: number
  category?: string
  freshnessWindow?: number
  tags?: string[]
  isBestseller?: boolean
  isAvailable?: boolean
  restaurantId?: string
  image?: File | null
}
