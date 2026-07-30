import type { ConfidenceLevel } from "@/components/ai/confidence-badge"
import type { PredictionSource } from "@/components/ai/source-badge"

/** Beyond `today + MAX_HORIZON_DAYS`, the backend throws a 400 — see
 * `getProductionPlan` in the service (`MAX_HORIZON_DAYS = 14`). */
export const MAX_HORIZON_DAYS = 14

export interface ProductionPlanProduct {
  _id: string
  title: string
  image?: string
  price: number
  freshnessWindow?: number
  category?: string
}

/**
 * A production plan can only ever be driven by the AI model or copied
 * forward from yesterday's plan (never a discount rule or a naive weekly
 * estimate) — a narrower union than the full `PredictionSource`, but every
 * member of it is a member of that union too, so it's assignable straight
 * into `<SourceBadge source={item.source} />` with no cast.
 */
export type ProductionPlanSource = Extract<
  PredictionSource,
  "ai_model" | "fallback_yesterday"
>

export interface ProductionPlanItem {
  productId: ProductionPlanProduct | string
  recommendedQty: number
  lowerBound?: number
  upperBound?: number
  confidence: ConfidenceLevel
  source: ProductionPlanSource
  /**
   * The Mongoose schema (`daily-production-plan.model.ts`) declares this as
   * an untyped array, NOT `string[]` — one backend code path writes
   * `[factor]` where `factor` is a single unknown value. Render defensively:
   * never assume element shape, coerce with `String()` before display.
   */
  factors?: unknown[]
  actualProducedQty?: number | null
}

export interface ProductionPlan {
  _id: string
  restaurantId: string
  date: string
  totalRecommendedQty: number
  items: ProductionPlanItem[]
  isDeleted: boolean
}

export type ProductionPlanDegradedKind = "unavailable" | "client_error"

/**
 * GET /predictions/production-plan replies `res.status(200).json(result)` —
 * raw, no outer `data` wrapper added by the controller. This is that whole
 * shape. The BFF route passes it through whole (see
 * app/api/predictions/production-plan/route.ts) specifically so
 * `degraded`/`degradedReason` survive for the banner — unwrapping to just
 * `.data` here would silently drop them.
 */
export interface ProductionPlanResponse {
  success: true
  data: ProductionPlan
  degraded?: boolean
  degradedReason?: string
  degradedKind?: ProductionPlanDegradedKind
  degradedStatus?: number
}

export interface RecordActualsItem {
  productId: string
  actualProducedQty: number
}

// A `type` alias, not an `interface`: TS infers an implicit string index
// signature for an object type alias but not for a declared `interface`
// (interfaces support later declaration merging, so TS can't assume no
// other props exist), and `clientFetch`'s `body` param requires exactly
// that index signature (`Record<string, unknown>`) to accept a plain data
// object. `RecordActualsResponse` below stays an `interface` since it's
// never passed as a request body.
export type RecordActualsInput = {
  date?: string
  items: RecordActualsItem[]
}

/**
 * POST /predictions/production-plan/actuals replies raw, same shape rule as
 * above. `applied`/`skipped` list which submitted productIds landed vs were
 * silently dropped (not part of the plan) — both must survive the BFF hop,
 * so this route also passes the whole envelope through.
 */
export interface RecordActualsResponse {
  success: true
  data: ProductionPlan
  applied: string[]
  skipped: string[]
}

export function getProductId(item: ProductionPlanItem): string {
  return typeof item.productId === "string" ? item.productId : item.productId._id
}
