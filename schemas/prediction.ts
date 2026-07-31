import { z } from "zod"

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")

export const recalculatePredictionSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid product id"),
  targetWeek: dateString.optional(),
})

export const batchRecalculateSchema = z.object({
  targetWeek: dateString.optional(),
})

export const aiBackfillSchema = z.object({
  // CORRECTION (controller, pre-flight): an earlier draft capped this at 730,
  // but the backend's AiBackfillDto is @Min(1) @Max(365) with a default of 120.
  // A client-accepted 730 would have been rejected upstream with a 400.
  days: z.number().int().min(1).max(365).optional(),
})

export type RecalculatePredictionInput = z.infer<typeof recalculatePredictionSchema>
export type BatchRecalculateInput = z.infer<typeof batchRecalculateSchema>
export type AiBackfillInput = z.infer<typeof aiBackfillSchema>
