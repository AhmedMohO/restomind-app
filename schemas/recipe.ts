import { z } from "zod"

import { INGREDIENT_UNITS } from "@/features/ingredients/api/type"

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, { message: "invalidMongoId" })

/** Guards against a stray keystroke sending an absurd portion size upstream. */
const MAX_QUANTITY_PER_PORTION = 100_000

/**
 * A single recipe line.
 *
 * `unit` is not user-editable in the UI — it is copied from the selected
 * ingredient, because the backend rejects any line whose unit differs from the
 * ingredient's own unit.
 */
export const recipeIngredientSchema = z.object({
  ingredientId: mongoId,
  quantityPerPortion: z.coerce
    .number()
    .positive({ message: "positiveValue" })
    .max(MAX_QUANTITY_PER_PORTION),
  unit: z.enum(INGREDIENT_UNITS),
  // The backend validates yield as positive and <= 100, so 0 is not allowed.
  yieldPercentage: z.coerce
    .number()
    .positive({ message: "positiveValue" })
    .max(100)
    .default(100),
})

export const recipeFormSchema = z.object({
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, { message: "recipeNeedsIngredient" })
    // The backend rejects duplicates outright; catching it here points at the
    // offending row instead of failing the whole request with a flat message.
    .superRefine((ingredients, ctx) => {
      const seen = new Map<string, number>()
      ingredients.forEach((item, index) => {
        if (!item.ingredientId) return
        if (seen.has(item.ingredientId)) {
          ctx.addIssue({
            code: "custom",
            message: "duplicateIngredient",
            path: [index, "ingredientId"],
          })
        } else {
          seen.set(item.ingredientId, index)
        }
      })
    }),
})

export type RecipeFormInput = z.infer<typeof recipeFormSchema>
export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>
