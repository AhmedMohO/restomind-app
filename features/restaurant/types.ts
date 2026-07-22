/**
 * Server-side domain types for the Restaurant feature.
 *
 * These mirror the Restaurant schema documented in
 * `docs/API_DOCUMENTATION.md` (Section 3) — single source of truth for
 * client/server boundary contracts in the dashboard restaurant module.
 */

export interface RestaurantAddress {
  street?: string
  city?: string
  country?: string
}

export interface OwnerUserSummary {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

export interface Restaurant {
  _id: string
  name: string
  ownerUserId: OwnerUserSummary
  description?: string
  /** Public URL string per the API schema. */
  logoUrl?: string
  phone?: string
  address?: RestaurantAddress
  isActive: boolean
  isDeleted: boolean
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateRestaurantPayload {
  name?: string
  description?: string | null
  phone?: string | null
  logoUrl?: string | null
  address?: RestaurantAddress
  isActive?: boolean
}

export interface PaginatedRestaurants {
  items: Restaurant[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetRestaurantsParams {
  page?: number | string
  limit?: number | string
  search?: string
}

export interface CreateRestaurantPayload {
  name: string
  ownerUserId: string
  description?: string
  phone?: string
  logoUrl?: string
  address?: RestaurantAddress
}

