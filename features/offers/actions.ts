"use server"

import {
  getActiveOffers,
  getActiveOffer,
  getRecommendedOffers,
  type GetActiveOffersParams,
  type ApiOffer,
  type PaginatedOffers,
  GetRecommendedOffersParams,
} from "./api"

/** Server Action: Fetch active offers (paginated & filtered) */
export async function fetchActiveOffersAction(
  params: GetActiveOffersParams = {}
): Promise<PaginatedOffers> {
  return getActiveOffers(params)
}

export async function fetchRecommendedOffersAction(
  params: GetRecommendedOffersParams = {}
): Promise<PaginatedOffers> {
  return getRecommendedOffers(params)
}

/** Server Action: Fetch single active offer details by ID or slug */
export async function fetchActiveOfferByIdAction(
  id: string
): Promise<{ data: ApiOffer } | null> {
  try {
    return await getActiveOffer(id)
  } catch (error) {
    console.error(`[fetchActiveOfferByIdAction] Error fetching active offer ${id}:`, error)
    return null
  }
}
