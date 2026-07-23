import { z } from "zod"

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "required" })
    .max(100, { message: "categoryNameMax" }),
  description: z
    .string()
    .max(500, { message: "categoryDescMax" })
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : undefined)),
})

export type CategoryInput = z.infer<typeof categorySchema>
