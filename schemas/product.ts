import { z } from "zod"

const mongoIdMessage = "invalidMongoId"
const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, { message: mongoIdMessage })

export const productFormSchema = z.object({
  title: z.string().min(1, { message: "required" }).max(160),
  description: z.string().min(1, { message: "required" }).max(600),
  longDescription: z.string().min(1, { message: "required" }).max(3000),
  price: z.coerce.number().min(0, { message: "min" }),
  category: mongoId,
  freshnessWindow: z.coerce.number().int().min(0).default(24),
  tagsText: z.string().optional(),
  isBestseller: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  restaurantId: z
    .union([mongoId, z.literal("")])
    .optional()
    .transform((value) => value || undefined),
})

export type ProductFormInput = z.infer<typeof productFormSchema>
