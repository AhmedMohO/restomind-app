import { z } from "zod"

const offerStatusEnum = z.enum([
  "draft",
  "scheduled",
  "active",
  "expired",
  "cancelled",
  "sold_out",
])
const discountTypeEnum = z.enum(["percentage", "fixed"])

export const createOfferSchema = z.object({
  productId: z.string().min(1),
  discountType: discountTypeEnum.optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  offerPrice: z.number().nonnegative().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  availableQuantity: z.number().int().positive(),
  maxPerCustomer: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  status: offerStatusEnum.optional(),
})

export const updateOfferSchema = z.object({
  discountType: discountTypeEnum.optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  offerPrice: z.number().nonnegative().optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  availableQuantity: z.number().int().positive().optional(),
  maxPerCustomer: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  status: offerStatusEnum.optional(),
})
