import type { ApiRestaurant } from "@/features/orders/api/type"
import type { ApiProduct } from "@/features/products/api/type"
import type { ApiUser } from "@/features/users/api/type"

export interface ApiOffer {
  _id: string
  slug: string 
  productId: ApiProduct
  restaurantId: string | ApiRestaurant
  originalPrice: number
  offerPrice: number
  discountPercentage: number
  availableQuantity: number
  remainingQuantity: number
  maxPerCustomer?: number
  startDate: string
  endDate: string
  status: "draft" | "scheduled" | "active" | "expired" | "cancelled" | "sold_out"
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
  status?: "draft" | "scheduled" | "active" | "expired" | "cancelled" | "sold_out"
  productId?: string
  categoryId?: string
  source?: "manual" | "ai_recommendation"
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  search?: string
  sortBy?: "createdAt" | "offerPrice" | "discountPercentage" | "startDate" | "endDate"
  sortOrder?: "asc" | "desc"
  page?: number | string
  limit?: number | string
}

export interface GetActiveOffersParams {
  page?: number | string
  limit?: number | string
  restaurantId?: string
  categoryId?: string
  productId?: string
  source?: "manual" | "ai_recommendation"
  search?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: "createdAt" | "offerPrice" | "discountPercentage" | "startDate" | "endDate"
  sortOrder?: "asc" | "desc"
  sort?: string
  order?: "asc" | "desc"
  category?: string
}

export interface GetRecommendedOffersParams {
  restaurantId?: string
  categoryId?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  page?: number | string
  limit?: number | string
}

