import { z } from "zod"

export const approveRecommendationSchema = z.object({
  discountPercentage: z.number().min(1).max(100).optional(),
  availableQuantity: z.number().int().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxPerCustomer: z.number().int().min(1).optional(),
})

export const editRecommendationSchema = z.object({
  // Mirrors the backend cap. Uncapped, this produced a negative offer price.
  suggestedValue: z.number().min(1).max(100),
})

export type ApproveRecommendationInput = z.infer<typeof approveRecommendationSchema>
export type EditRecommendationInput = z.infer<typeof editRecommendationSchema>
