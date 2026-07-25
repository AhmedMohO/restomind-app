import type {
  ApiIngredient,
  IngredientUnit,
} from "@/features/ingredients/api/type"

/**
 * A recipe line. `ingredientId` arrives populated from `GET`, but is sent as a
 * plain ObjectId string on `PUT`.
 */
export interface ApiRecipeIngredient {
  ingredientId: ApiIngredient | string
  quantityPerPortion: number
  unit: IngredientUnit
  yieldPercentage: number
}

export interface ApiRecipe {
  _id: string
  restaurantId: string
  productId: string
  ingredients: ApiRecipeIngredient[]
  isDeleted: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Request body for `PUT /products/:productId/recipe`.
 * A type alias rather than an interface so it satisfies the
 * `Record<string, unknown>` JSON body constraint of `clientFetch`.
 */
export type UpsertRecipePayload = {
  ingredients: Array<{
    ingredientId: string
    quantityPerPortion: number
    unit: IngredientUnit
    yieldPercentage: number
  }>
}

/** Narrows a populated-or-string `ingredientId` to the populated object. */
export function getRecipeIngredient(
  value: ApiRecipeIngredient["ingredientId"]
): ApiIngredient | null {
  return typeof value === "string" ? null : (value ?? null)
}

/** Extracts the ingredient id regardless of whether it arrived populated. */
export function getRecipeIngredientId(
  value: ApiRecipeIngredient["ingredientId"]
): string {
  return typeof value === "string" ? value : (value?._id ?? "")
}

/**
 * Gross quantity actually consumed per portion once yield loss (trimming,
 * evaporation, waste) is accounted for: `net / (yield / 100)`.
 *
 * Returns the net quantity unchanged when the yield is missing or invalid, so
 * a bad value can never produce Infinity or NaN in the UI.
 */
export function getGrossQuantity(
  quantityPerPortion: number,
  yieldPercentage: number
): number {
  if (
    !Number.isFinite(quantityPerPortion) ||
    !Number.isFinite(yieldPercentage) ||
    yieldPercentage <= 0
  ) {
    return Number.isFinite(quantityPerPortion) ? quantityPerPortion : 0
  }
  return quantityPerPortion / (yieldPercentage / 100)
}
