import { z } from "zod"

// ---------------------------------------------------------------------------
// Profile Information Update Schema
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  firstName: z.string().min(3).max(20),
  lastName: z.string().min(3).max(20),
  phone: z.string().optional(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  DOB: z.string().optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ---------------------------------------------------------------------------
// Delivery Address Schema
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  label: z.string().optional(),
  phoneNumber: z.string().min(8, { message: "errorValidPhone" }),
  street: z.string().min(5, { message: "errorMinStreet" }),
  city: z.string().min(2, { message: "errorMinCity" }),
  country: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>
