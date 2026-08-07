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

export interface RestaurantImage {
  public_id: string
  secure_url: string
}

/** Where a payout is transferred. Absent means payouts are blocked. */
export interface PayoutDestination {
  method: "bank" | "wallet"
  accountName: string
  accountNumber: string
  bankName?: string
}

export interface Restaurant {
  _id: string
  name: string
  ownerUserId: OwnerUserSummary
  description?: string
  /** Cloudinary image object per backend schema */
  image?: RestaurantImage
  phone?: string
  address?: RestaurantAddress
  /**
   * Negotiated marketplace commission as a FRACTION (0.05 is 5%).
   *
   * Absent OR null means the platform default in system settings applies —
   * null is what a cleared override reads back as, and treating it as a number
   * would render it as 0%, i.e. a free merchant. Admin-only to write.
   */
  commissionRate?: number | null
  payoutDestination?: PayoutDestination
  isActive: boolean
  isDeleted: boolean
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateRestaurantPayload {
  name?: string
  ownerUserId?: string
  description?: string | null
  phone?: string | null
  image?: string | null
  address?: RestaurantAddress
  isActive?: boolean
  /**
   * Admin-only: the API rejects both of these from a manager.
   *
   * `null` clears the commission override so the platform default applies
   * again. `undefined` means "leave it alone" and is dropped from the body.
   */
  commissionRate?: number | null
  payoutDestination?: PayoutDestination
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
  image?: string
  address?: RestaurantAddress
}
