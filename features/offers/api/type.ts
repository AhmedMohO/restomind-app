import type { ApiRestaurant } from "@/features/orders/api/type"
import type { ApiProduct } from "@/features/products/api/type"
import type { ApiUser } from "@/features/users/api/type"

export interface ApiOffer {
  _id: string
  slug: string 
  productId: ApiProduct
  restaurantId: string | ApiRestaurant
  discountPercentage: number
  startDate: string
  endDate: string
  status: "draft" | "scheduled" | "active" | "expired" | "cancelled"
  source: "manual" | "ai_recommendation"
  recommendationId?: string
  featured?: boolean
  estimatedWasteReduction?: number
  estimatedRevenueRecovery?: number
  actualUnitsSold?: number
  actualRevenueRecovered?: number
  createdBy?: ApiUser
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedOffers {
  items: ApiOffer[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetOffersParams {
  status?: "draft" | "scheduled" | "active" | "expired" | "cancelled"
  productId?: string
  source?: "manual" | "ai_recommendation"
  page?: number | string
  limit?: number | string
}

export interface GetActiveOffersParams {
  page?: number | string
  limit?: number | string
  productId?: string
  source?: "manual" | "ai_recommendation"
  search?: string
  sort?: string
  order?: "asc" | "desc"
  category?: string
}
