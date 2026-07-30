import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import {
  EMPTY_RECOMMENDATIONS_PAGE,
  type GetRecommendationsParams,
  type PaginatedRecommendations,
} from "./type"

export * from "./type"

/**
 * GET /recommendations — paginated AI surplus-discount recommendations for
 * the manager's restaurant.
 */
export async function getRecommendations(
  params: GetRecommendationsParams = {}
): Promise<PaginatedRecommendations> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/recommendations${qs}`)
  const body = await parseOrThrow<PaginatedRecommendations>(
    response,
    "getRecommendations"
  )
  return body ?? EMPTY_RECOMMENDATIONS_PAGE
}
