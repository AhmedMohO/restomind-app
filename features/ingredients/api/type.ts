/**
 * Ingredient inventory types.
 *
 * Mirrors the backend `Ingredient` model exactly — every ingredient is scoped
 * to the authenticated manager's restaurant, so no `restaurantId` is ever sent
 * from the client.
 */

/** Units accepted by the backend `IngredientUnitEnum`. */
export const INGREDIENT_UNITS = ["kg", "liter", "piece"] as const

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number]

export interface ApiIngredient {
  _id: string
  restaurantId: string
  ingredientCode: string
  name: string
  unit: IngredientUnit
  shelfLifeDays: number
  minimumStock: number
  safetyStock: number
  isDeleted: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedIngredients {
  items: ApiIngredient[]
  page: number
  limit: number
  total: number
  totalPages: number
}

/** The backend only supports these three query parameters. */
export interface GetIngredientsParams {
  page?: number
  limit?: number
  search?: string
}

/**
 * Request body for `POST /ingredients` and `PATCH /ingredients/:id`.
 * Declared as a type alias (not an interface) so it satisfies the
 * `Record<string, unknown>` JSON body constraint of `clientFetch`.
 */
export type IngredientPayload = {
  ingredientCode: string
  name: string
  unit: IngredientUnit
  shelfLifeDays: number
  minimumStock: number
  safetyStock: number
}

export const EMPTY_INGREDIENTS_PAGE: PaginatedIngredients = {
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}
