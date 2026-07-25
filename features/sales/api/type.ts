/**
 * Sales transaction types.
 *
 * `GET /sales` and `GET /sales/summary` both wrap their payload in a `data`
 * envelope upstream; the BFF route unwraps it so the client sees a flat shape.
 */

export const SALES_SOURCES = [
  "csv_import",
  "marketplace_order",
  "pos_sync",
] as const

export type SalesSource = (typeof SALES_SOURCES)[number]

export const SALES_SORT_FIELDS = [
  "date",
  "quantitySold",
  "sellingPrice",
] as const

export type SalesSortField = (typeof SALES_SORT_FIELDS)[number]

/** Populated refs — the backend selects a subset of fields for each. */
export interface SalesRestaurantRef {
  _id: string
  name?: string
  title?: string
}

export interface SalesProductRef {
  _id: string
  title?: string
  price?: number
  discountedPrice?: number
  category?: string | { _id: string; name?: string }
}

export interface ApiSalesTransaction {
  _id: string
  restaurantId: SalesRestaurantRef | string | null
  productId: SalesProductRef | string | null
  date: string
  quantitySold: number
  basePrice: number
  sellingPrice: number
  promotionActive: boolean
  featured: boolean
  salesChannel: string
  source: SalesSource
  orderId?: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedSales {
  items: ApiSalesTransaction[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SalesSummary {
  totalTransactions: number
  totalQuantitySold: number
  totalGrossRevenue: number
  totalNetRevenue: number
  totalDiscountsGiven: number
  promotionalSalesCount: number
  featuredSalesCount: number
  averageSellingPrice: number
}

export interface GetSalesParams {
  restaurantId?: string
  productId?: string
  startDate?: string
  endDate?: string
  source?: SalesSource
  page?: number
  limit?: number
  sort?: SalesSortField
  order?: "asc" | "desc"
}

/** Summary ignores pagination and sorting. */
export type GetSalesSummaryParams = Omit<
  GetSalesParams,
  "page" | "limit" | "sort" | "order"
>

export const EMPTY_SALES_PAGE: PaginatedSales = {
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}

export const EMPTY_SALES_SUMMARY: SalesSummary = {
  totalTransactions: 0,
  totalQuantitySold: 0,
  totalGrossRevenue: 0,
  totalNetRevenue: 0,
  totalDiscountsGiven: 0,
  promotionalSalesCount: 0,
  featuredSalesCount: 0,
  averageSellingPrice: 0,
}

export function getSalesProductName(
  value: ApiSalesTransaction["productId"]
): string {
  if (!value) return "—"
  if (typeof value === "string") return "—"
  return value.title ?? "—"
}

export function getSalesRestaurantName(
  value: ApiSalesTransaction["restaurantId"]
): string {
  if (!value) return "—"
  if (typeof value === "string") return "—"
  return value.name ?? value.title ?? "—"
}

/** Per-transaction discount: what the promotion gave away on this line. */
export function getLineDiscount(transaction: ApiSalesTransaction): number {
  const delta = (transaction.basePrice - transaction.sellingPrice) * transaction.quantitySold
  return delta > 0 ? delta : 0
}
