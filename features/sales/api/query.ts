import type { UserRole } from "@/features/auth/auth"
import {
  SALES_SORT_FIELDS,
  SALES_SOURCES,
  type GetSalesParams,
  type SalesSortField,
  type SalesSource,
} from "./type"

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100
const MONGO_ID = /^[a-f\d]{24}$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T.*)?$/

export type ParsedSalesQuery =
  | { ok: true; params: GetSalesParams }
  | { ok: false; message: string }

function toPositiveInt(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  const int = Math.floor(parsed)
  return max ? Math.min(int, max) : int
}

function isValidDate(value: string): boolean {
  return ISO_DATE.test(value) && !Number.isNaN(new Date(value).getTime())
}

/**
 * Validates and normalises `/sales` query parameters at the BFF boundary.
 *
 * Two rules matter beyond plain validation:
 *
 * 1. Managers are hard-scoped upstream to their own restaurant, and the API
 *    returns 403 if they pass any `restaurantId`. The parameter is therefore
 *    dropped for managers rather than forwarded.
 * 2. `startDate` after `endDate` would silently return zero rows, so it is
 *    rejected as a 400 with an explicit message instead.
 *
 * @param includePagination `false` for the summary endpoint, which ignores
 *   page/limit/sort/order.
 */
export function parseSalesQuery(
  searchParams: URLSearchParams,
  role: UserRole,
  includePagination = true
): ParsedSalesQuery {
  const params: GetSalesParams = {}

  const restaurantId = searchParams.get("restaurantId")?.trim()
  if (restaurantId && role !== "manager") {
    if (!MONGO_ID.test(restaurantId)) {
      return { ok: false, message: "Invalid restaurantId" }
    }
    params.restaurantId = restaurantId
  }

  const productId = searchParams.get("productId")?.trim()
  if (productId) {
    if (!MONGO_ID.test(productId)) {
      return { ok: false, message: "Invalid productId" }
    }
    params.productId = productId
  }

  const startDate = searchParams.get("startDate")?.trim()
  if (startDate) {
    if (!isValidDate(startDate)) {
      return { ok: false, message: "Invalid startDate" }
    }
    params.startDate = startDate
  }

  const endDate = searchParams.get("endDate")?.trim()
  if (endDate) {
    if (!isValidDate(endDate)) {
      return { ok: false, message: "Invalid endDate" }
    }
    params.endDate = endDate
  }

  if (
    params.startDate &&
    params.endDate &&
    new Date(params.startDate).getTime() > new Date(params.endDate).getTime()
  ) {
    return { ok: false, message: "startDate must be before endDate" }
  }

  const source = searchParams.get("source")?.trim()
  if (source) {
    if (!SALES_SOURCES.includes(source as SalesSource)) {
      return { ok: false, message: "Invalid source" }
    }
    params.source = source as SalesSource
  }

  if (includePagination) {
    params.page = toPositiveInt(searchParams.get("page"), 1)
    params.limit = toPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT)

    const sort = searchParams.get("sort")?.trim()
    params.sort = SALES_SORT_FIELDS.includes(sort as SalesSortField)
      ? (sort as SalesSortField)
      : "date"

    params.order = searchParams.get("order") === "asc" ? "asc" : "desc"
  }

  return { ok: true, params }
}
