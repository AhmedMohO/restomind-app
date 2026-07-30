import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import {
  EMPTY_WASTE_PAGE,
  EMPTY_WASTE_SUMMARY,
  type GetWasteReportsParams,
  type PaginatedWasteReports,
  type WasteSummary,
} from "./type"

export * from "./type"

/**
 * GET /waste-reports — raw `{ items, total }`, no `data` wrapper (see
 * type.ts). Unwrapping via `body.data` here would silently discard every
 * report the way the recommendations/predictions envelope bug already did
 * for two other screens — `body` itself IS the page, so it's returned
 * as-is (falling back to the empty page only if the body is somehow
 * missing entirely, e.g. a malformed non-JSON response).
 */
export async function getWasteReports(
  params: GetWasteReportsParams = {}
): Promise<PaginatedWasteReports> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/waste-reports${qs}`)
  const body = await parseOrThrow<PaginatedWasteReports>(
    response,
    "getWasteReports"
  )
  return body ?? EMPTY_WASTE_PAGE
}

/**
 * GET /waste-reports/summary?days= — raw summary object, same no-wrapper
 * rule. The backend itself clamps `days` to 1..365 (default 30) before
 * this ever reaches it; the BFF route mirrors that clamp rather than
 * rejecting an out-of-range value.
 */
export async function getWasteSummary(days = 30): Promise<WasteSummary> {
  const response = await apiClient(`/waste-reports/summary?days=${days}`)
  const body = await parseOrThrow<WasteSummary>(response, "getWasteSummary")
  return body ?? EMPTY_WASTE_SUMMARY
}
