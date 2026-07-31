import type { ConfidenceLevel } from "@/components/ai/confidence-badge"
import type { PredictionSource } from "@/components/ai/source-badge"
import { ApiImage } from "@/features/users/api"

export interface Factor {
  factor: string
  impact_pct: number
}

export interface DailyBreakdownItem {
  date: string
  predictedQuantity: number
}

export interface PredictionProduct {
  _id: string
  title: string
  image?: ApiImage
}

export interface Prediction {
  _id: string
  productId: PredictionProduct | string
  modelVersionId: string
  targetWeek: string
  predictedOrders: number
  confidence: ConfidenceLevel
  source: PredictionSource
  featuresUsed: Record<string, unknown>
  factors: Factor[]
  dailyBreakdown: DailyBreakdownItem[]
  actualOrders: number | null
  errorAbs: number | null
  updatedAt: string
}

export interface PaginatedPredictions {
  items: Prediction[]
  total: number
  page: number
  limit: number
}

export interface LearnedStatusItem {
  productId: string
  title: string
  salesRecordsCount: number
  observedDays: number
  levelSource: "learned_from_sales" | "owner_estimate"
  learnedLevel: number | null
  status: "trained" | "learning" | "cold_start"
  progress: number
  latestModelVersion: string
  latestPredictionSource: string
  lastUpdated: string | null
}

export interface LearnedStatus {
  restaurantId: string
  totalProducts: number
  trainedCount: number
  degraded: boolean
  degradedReason?: string
  items: LearnedStatusItem[]
}

export interface AccuracyWeek {
  targetWeek: string
  predictions: number
  mape: number | null
  totalPredicted: number
  totalActual: number
}

export interface Accuracy {
  restaurantId: string
  weeks: AccuracyWeek[]
}

export interface GetPredictionsParams {
  page?: number
  limit?: number
  targetWeek?: string
  productId?: string
}

export const EMPTY_PREDICTIONS_PAGE: PaginatedPredictions = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
}

export const EMPTY_LEARNED_STATUS: LearnedStatus = {
  restaurantId: "",
  totalProducts: 0,
  trainedCount: 0,
  degraded: false,
  items: [],
}

export const EMPTY_ACCURACY: Accuracy = { restaurantId: "", weeks: [] }
