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
  try {
    return await getRecommendedOffers(params)
  } catch (error: any) {
    if (error?.digest === "HANGING_PROMISE_REJECTION" || error?.message?.includes("prerender")) {
      throw error
    }
    console.error("[fetchRecommendedOffersAction] Error fetching recommended offers:", error)
    return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  }
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
