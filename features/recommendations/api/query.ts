import type { GetRecommendationsParams, RecommendationStatus } from "./type"

type ParseResult =
  | { ok: true; params: GetRecommendationsParams }
  | { ok: false; message: string }

const STATUSES: RecommendationStatus[] = [
  "pending",
  "approved",
  "dismissed",
  "edited",
]

/**
 * Validates at the BFF boundary so a malformed filter gets a 400 with detail
 * rather than an opaque upstream error.
 */
export function parseRecommendationsQuery(sp: URLSearchParams): ParseResult {
  const params: GetRecommendationsParams = {}

  const page = sp.get("page")
  if (page !== null) {
    const n = Number(page)
    if (!Number.isInteger(n) || n < 1) return { ok: false, message: "page must be a positive integer" }
    params.page = n
  }

  const limit = sp.get("limit")
  if (limit !== null) {
    const n = Number(limit)
    if (!Number.isInteger(n) || n < 1 || n > 100)
      return { ok: false, message: "limit must be an integer between 1 and 100" }
    params.limit = n
  }

  const status = sp.get("status")
  if (status !== null) {
    if (!STATUSES.includes(status as RecommendationStatus))
      return { ok: false, message: `status must be one of ${STATUSES.join(", ")}` }
    params.status = status as RecommendationStatus
  }

  const productId = sp.get("productId")
  if (productId !== null) {
    if (!/^[a-f\d]{24}$/i.test(productId))
      return { ok: false, message: "productId must be a valid id" }
    params.productId = productId
  }

  return { ok: true, params }
}
