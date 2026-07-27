import "server-only"

import { apiClient, publicApiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  ApiOffer,
  CreateOfferInput,
  GetActiveOffersParams,
  GetOffersParams,
  GetRecommendedOffersParams,
  PaginatedOffers,
  UpdateOfferInput,
} from "./type"

export * from "./type"

/** GET /offers/active — fetch paginated list of active offers (public) */
export async function getActiveOffers(
  params: GetActiveOffersParams = {}
): Promise<PaginatedOffers> {
  const qs = buildQueryString(params)
  const response = await publicApiClient(`/offers/active${qs}`)
  return parseOrThrow<PaginatedOffers>(response, "getActiveOffers")
}

/** GET /offers/recommendations — recommended offers (public) */
export async function getRecommendedOffers(
  params: GetRecommendedOffersParams = {}
): Promise<PaginatedOffers> {
  const qs = buildQueryString(params)
  const response = await publicApiClient(`/offers/recommendations${qs}`)
  return parseOrThrow<PaginatedOffers>(response, "getRecommendedOffers")
}

/** GET /offers/active/:id — fetch details of a single active offer by ID (public) */
export async function getActiveOffer(
  id: string
): Promise<{ data: ApiOffer }> {
  const response = await publicApiClient(`/offers/active/${id}`)
  return parseOrThrow<{ data: ApiOffer }>(response, "getActiveOffer")
}

/** GET /offers — fetch paginated list of offers for manager */
export async function getOffers(
  params: GetOffersParams = {}
): Promise<PaginatedOffers> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/offers${qs}`)
  return parseOrThrow<PaginatedOffers>(response, "getOffers")
}

/** GET /offers/:id — fetch details of a single offer by ID for manager */
export async function getOfferById(
  id: string
): Promise<{ data: ApiOffer }> {
  const response = await apiClient(`/offers/${id}`)
  return parseOrThrow<{ data: ApiOffer }>(response, "getOfferById")
}

/** POST /offers — create offer for manager */
export async function createOffer(
  data: CreateOfferInput
): Promise<{ data: ApiOffer }> {
  const response = await apiClient("/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return parseOrThrow<{ data: ApiOffer }>(response, "createOffer")
}

/** PATCH /offers/:id — update offer for manager */
export async function updateOffer(
  id: string,
  data: UpdateOfferInput
): Promise<{ data: ApiOffer }> {
  const response = await apiClient(`/offers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return parseOrThrow<{ data: ApiOffer }>(response, "updateOffer")
}

/** PATCH /offers/:id/cancel — cancel offer for manager */
export async function cancelOffer(
  id: string
): Promise<{ data: ApiOffer }> {
  const response = await apiClient(`/offers/${id}/cancel`, {
    method: "PATCH",
  })
  return parseOrThrow<{ data: ApiOffer }>(response, "cancelOffer")
}


