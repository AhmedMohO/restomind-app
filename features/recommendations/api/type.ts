export type RecommendationStatus =
  | "pending"
  | "approved"
  | "dismissed"
  | "edited"

export interface RecommendationProduct {
  _id: string
  title: string
  price: number
  image?: string
  freshnessWindow?: number
}

export interface Recommendation {
  _id: string
  productId: RecommendationProduct | string
  type: string
  suggestedValue: number
  gptExplanation: string
  status: RecommendationStatus
  wasteReportId?: string
  createdAt: string
}

export interface PaginatedRecommendations {
  items: Recommendation[]
  total: number
  page: number
  limit: number
}

export interface SurplusItem {
  productId: string
  title: string
  currentStock: number
  projectedSurplus: number
  riskScore: number
  urgency: "low" | "medium" | "high"
  hoursToClose: number
  suggestedDiscountPct: number
  offerCopyAr: string | null
  newPrice: number | null
}

export interface ScanSurplusResult {
  message: string
  checkedAt: string
  itemsAtRiskCount: number
  itemsAtRisk: SurplusItem[]
  recommendations: Recommendation[]
  wasteReportsWritten?: number
}

export interface GetRecommendationsParams {
  page?: number
  limit?: number
  status?: RecommendationStatus
  productId?: string
}

export const EMPTY_RECOMMENDATIONS_PAGE: PaginatedRecommendations = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
}
