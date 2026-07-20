import "server-only"

import { publicApiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  ApiOffer,
  GetActiveOffersParams,
  PaginatedOffers,
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

/** GET /offers/active/:id — fetch details of a single active offer by ID (public) */
export async function getActiveOffer(
  id: string
): Promise<{ data: ApiOffer }> {
  const response = await publicApiClient(`/offers/active/${id}`)
  return parseOrThrow<{ data: ApiOffer }>(response, "getActiveOffer")
}

