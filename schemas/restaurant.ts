import { z } from "zod"
import { optionalEgyptianPhoneSchema } from "@/lib/phone"

const optionalUrl = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined))
  .refine(
    (val) => {
      if (!val) return true
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    },
    { message: "invalidLogoUrl" }
  )

export const restaurantSchema = z.object({
  name: z
    .string()
    .min(3, { message: "restaurantNameMin" })
    .max(60, { message: "restaurantNameMax" }),
  description: z
    .string()
    .max(500, { message: "restaurantDescMax" })
    .optional()
    .nullable(),
  phone: optionalEgyptianPhoneSchema,
  logoUrl: optionalUrl,
  address: z
    .object({
      street: z
        .string()
        .min(3, { message: "errorMinStreet" })
        .optional()
        .nullable(),
      city: z
        .string()
        .min(2, { message: "errorMinCity" })
        .optional()
        .nullable(),
      country: z.string().optional().nullable(),
    })
    .optional(),
  isActive: z.boolean(),
})

export type RestaurantInput = z.infer<typeof restaurantSchema>
