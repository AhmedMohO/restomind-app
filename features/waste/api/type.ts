import type { ConfidenceLevel } from "@/components/ai/confidence-badge"
import type { PredictionSource } from "@/components/ai/source-badge"
import type { RiskLevel } from "@/lib/charts/palette"

/**
 * Types for `GET /waste-reports` and `GET /waste-reports/summary`, confirmed
 * against `waste-reports.service.ts` / `waste-report.model.ts` in the API
 * source directly (the backend repo is a sibling checkout, read-only — see
 * task-6-report.md for how this was cross-checked against the brief's
 * envelope guarantees).
 */

export interface WasteIngredient {
  _id: string
  name: string
  unit: string
  costPerUnit: number
}

export interface WastePrediction {
  _id: string
  targetWeek: string
  source: PredictionSource
  predictedOrders: number
  confidence: ConfidenceLevel
  modelVersionId: string
}

/**
 * One ingredient's surplus report from a scan. `predictionId` is `null`
 * when the report wasn't derived from a forecast at all (schema default),
 * and — like `ingredientId` — may also come back as a bare ObjectId string
 * when the backend didn't populate it. Never cast; use `resolveIngredient` /
 * `resolvePrediction` below.
 */
export interface WasteReport {
  _id: string
  ingredientId: WasteIngredient | string
  predictionId: WastePrediction | string | null
  expectedConsumption: number
  usableAvailableStock: number
  expectedSurplus: number
  riskLevel: RiskLevel
  createdAt: string
  updatedAt: string
}

/**
 * `GET /waste-reports` replies raw `{ items, total }` — the service returns
 * `wasteReportRepository.findManyPaginated(...)` straight through the
 * controller's `res.json(result)`, with no `data` wrapper. `page`/`limit`
 * are deliberately NOT part of this type: track them from the request, not
 * the response.
 */
export interface PaginatedWasteReports {
  items: WasteReport[]
  total: number
}

/** One row of `WasteSummary.reports` — an ingredient aggregated across the window. */
export interface WasteSummaryRow {
  ingredient: {
    name: string
    unit: string
    costPerUnit: number
  }
  totalExpectedConsumption: number
  totalUsableStock: number
  totalExpectedSurplus: number
  highestRiskLevel: RiskLevel
}

/**
 * `GET /waste-reports/summary` replies raw — the summary object at top
 * level, no `success`/`data` wrapper either.
 */
export interface WasteSummary {
  restaurantId: string
  windowDays: number
  totalReports: number
  totalSurplusQuantity: number
  totalEstimatedWasteCost: number
  riskBreakdown: {
    high: number
    medium: number
    low: number
  }
  reports: WasteSummaryRow[]
}

export interface GetWasteReportsParams {
  page?: number
  limit?: number
  riskLevel?: RiskLevel
  ingredientId?: string
}

export const EMPTY_WASTE_PAGE: PaginatedWasteReports = {
  items: [],
  total: 0,
}

export const EMPTY_WASTE_SUMMARY: WasteSummary = {
  restaurantId: "",
  windowDays: 30,
  totalReports: 0,
  totalSurplusQuantity: 0,
  totalEstimatedWasteCost: 0,
  riskBreakdown: { high: 0, medium: 0, low: 0 },
  reports: [],
}

/** Resolves a populated ingredient ref, or `null` for a bare id string. */
export function resolveIngredient(
  ref: WasteIngredient | string
): WasteIngredient | null {
  return typeof ref === "string" ? null : ref
}

/** Resolves a populated prediction ref, or `null` for a bare id string / absent link. */
export function resolvePrediction(
  ref: WastePrediction | string | null | undefined
): WastePrediction | null {
  return typeof ref === "string" || ref == null ? null : ref
}
