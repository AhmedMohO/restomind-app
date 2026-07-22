import { z } from "zod"
import { egyptianPhoneSchema, optionalEgyptianPhoneSchema } from "@/lib/phone"

// ---------------------------------------------------------------------------
// Profile Information Update Schema
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "firstNameMin" })
    .max(20, { message: "firstNameMax" }),
  lastName: z
    .string()
    .min(3, { message: "lastNameMin" })
    .max(20, { message: "lastNameMax" }),
  phone: optionalEgyptianPhoneSchema,
  gender: z.enum(["male", "female"]).optional().nullable(),
  DOB: z.string().optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ---------------------------------------------------------------------------
// Delivery Address Schema
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  label: z.string().optional(),
  phoneNumber: egyptianPhoneSchema,
  street: z.string().min(5, { message: "errorMinStreet" }),
  city: z.string().min(2, { message: "errorMinCity" }),
  country: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>
