import type { GetPredictionsParams } from "./type"

type ParseResult =
  | { ok: true; params: GetPredictionsParams }
  | { ok: false; message: string }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates at the BFF boundary so a malformed filter gets a 400 with detail
 * rather than an opaque upstream error.
 */
export function parsePredictionsQuery(sp: URLSearchParams): ParseResult {
  const params: GetPredictionsParams = {}

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

  const targetWeek = sp.get("targetWeek")
  if (targetWeek !== null) {
    if (!DATE_RE.test(targetWeek))
      return { ok: false, message: "targetWeek must be YYYY-MM-DD" }
    params.targetWeek = targetWeek
  }

  const productId = sp.get("productId")
  if (productId !== null) {
    if (!/^[a-f\d]{24}$/i.test(productId))
      return { ok: false, message: "productId must be a valid id" }
    params.productId = productId
  }

  return { ok: true, params }
}
