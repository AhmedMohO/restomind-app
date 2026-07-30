import "server-only"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import type {
  ProductionPlanResponse,
  RecordActualsInput,
  RecordActualsResponse,
} from "./type"

export * from "./type"

/**
 * GET /predictions/production-plan?date=YYYY-MM-DD — today or a past date's
 * plan, generated on demand for today/near-future dates.
 *
 * Unlike `getPredictions`/`getRecommendations` in the sibling features,
 * this deliberately returns the WHOLE upstream envelope, not `body.data`.
 * The controller replies raw (`{ success, data, degraded?, degradedReason?,
 * degradedKind?, degradedStatus? }`) and the `degraded*` fields live
 * alongside `data`, not inside it — unwrapping here would silently drop the
 * banner's only signal. `parseOrThrow` still throws on non-2xx, so a 404
 * (no plan for a past date) or 400 (beyond the 14-day horizon) surface as a
 * thrown `ApiError` with `.statusCode` set, for the route handler to pass
 * through via `handleUpstreamError`.
 */
export async function getProductionPlan(
  date: string,
  signal?: AbortSignal
): Promise<ProductionPlanResponse> {
  const response = await apiClient(
    `/predictions/production-plan?date=${encodeURIComponent(date)}`,
    { signal }
  )
  return parseOrThrow<ProductionPlanResponse>(response, "getProductionPlan")
}

/**
 * POST /predictions/production-plan/actuals — same whole-envelope rule:
 * `applied`/`skipped` sit next to `data`, not inside it.
 */
export async function recordProductionPlanActuals(
  input: RecordActualsInput
): Promise<RecordActualsResponse> {
  const response = await apiClient("/predictions/production-plan/actuals", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return parseOrThrow<RecordActualsResponse>(response, "recordProductionPlanActuals")
}
