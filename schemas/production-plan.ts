import { z } from "zod"

export const recordActualsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().regex(/^[a-f\d]{24}$/i),
        actualProducedQty: z.number().min(0).max(1_000_000),
      })
    )
    .min(1),
})

export type RecordActualsSchemaInput = z.infer<typeof recordActualsSchema>
