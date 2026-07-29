import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import {
  EMPTY_ACCURACY,
  EMPTY_LEARNED_STATUS,
  EMPTY_PREDICTIONS_PAGE,
  type Accuracy,
  type GetPredictionsParams,
  type LearnedStatus,
  type PaginatedPredictions,
} from "./type"

export * from "./type"

/** GET /predictions — paginated weekly forecasts for the manager's restaurant. */
export async function getPredictions(
  params: GetPredictionsParams = {}
): Promise<PaginatedPredictions> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/predictions${qs}`)
  const body = await parseOrThrow<{ data?: PaginatedPredictions }>(
    response,
    "getPredictions"
  )
  return body.data ?? EMPTY_PREDICTIONS_PAGE
}

/** GET /predictions/learned-status — per-product model training progress. */
export async function getLearnedStatus(): Promise<LearnedStatus> {
  const response = await apiClient("/predictions/learned-status")
  const body = await parseOrThrow<LearnedStatus>(response, "getLearnedStatus")
  return body ?? EMPTY_LEARNED_STATUS
}

/** GET /predictions/accuracy — rolling MAPE per closed week. */
export async function getAccuracy(weeks = 8): Promise<Accuracy> {
  const response = await apiClient(`/predictions/accuracy?weeks=${weeks}`)
  const body = await parseOrThrow<{ data?: Accuracy }>(response, "getAccuracy")
  return body.data ?? EMPTY_ACCURACY
}
