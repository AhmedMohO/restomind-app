import { z } from "zod"

import { INGREDIENT_UNITS } from "@/features/ingredients/api/type"

/** Upper bounds kept generous but finite so a typo can't send 1e21 to Mongo. */
const MAX_STOCK = 1_000_000
const MAX_SHELF_LIFE_DAYS = 3650 // 10 years

/**
 * Ingredient create/update payload.
 *
 * The backend requires `ingredientCode`, `name`, `unit` and `shelfLifeDays`;
 * `minimumStock` / `safetyStock` default to 0 server-side but are always sent
 * explicitly so an edit never silently resets them.
 */
export const ingredientFormSchema = z.object({
  // Length and range issues intentionally carry no custom message so the
  // locale-aware Zod error map can interpolate the actual bound.
  ingredientCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, { message: "invalidIngredientCode" }),
  name: z.string().trim().min(2).max(80),
  unit: z.enum(INGREDIENT_UNITS),
  shelfLifeDays: z.coerce.number().int().min(0).max(MAX_SHELF_LIFE_DAYS),
  minimumStock: z.coerce.number().min(0).max(MAX_STOCK).default(0),
  safetyStock: z.coerce.number().min(0).max(MAX_STOCK).default(0),
})

export type IngredientFormInput = z.infer<typeof ingredientFormSchema>

/** Partial variant used by `PATCH /ingredients/:id` route validation. */
export const ingredientUpdateSchema = ingredientFormSchema.partial()
