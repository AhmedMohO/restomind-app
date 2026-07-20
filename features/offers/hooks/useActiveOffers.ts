import { useQuery } from "@tanstack/react-query"
import { fetchActiveOffersAction } from "../actions"
import type { GetActiveOffersParams, PaginatedOffers } from "../api/type"

export const OFFERS_QUERY_KEY = "active-offers"

/**
 * Custom hook to fetch active offers using TanStack Query.
 */
export function useActiveOffers(
  params: GetActiveOffersParams = {},
  initialData?: PaginatedOffers
) {
  return useQuery<PaginatedOffers>({
    queryKey: [OFFERS_QUERY_KEY, params],
    queryFn: () => fetchActiveOffersAction(params),
    initialData: params.page === 1 || !params.page ? initialData : undefined,
  })
}
