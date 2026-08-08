import { z } from "zod"

export const createPartnershipSchema = z.object({
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  description: z.string().optional(),
  estimatedOrdersPerDay: z.number().nonnegative().optional(),
  estimatedWasteKgPerDay: z.number().nonnegative().optional(),
  ownerFirstName: z.string().min(1),
  ownerLastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  district: z.string().optional(),
  street: z.string().optional(),
  website: z.string().optional(),
  facebookPage: z.string().optional(),
  instagramPage: z.string().optional(),
  commercialRegistration: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
})

export const rejectPartnershipSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
})
