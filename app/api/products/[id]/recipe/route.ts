import { connection } from "next/server"

import {
  getProductRecipe,
  upsertProductRecipe,
} from "@/features/recipes/api"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAuth,
} from "@/lib/api/route-helpers"
import { recipeFormSchema } from "@/schemas/recipe"

/** Recipes belong to a restaurant, so only its manager may read or write them. */
const RECIPE_ROLE = "manager" as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAuth(RECIPE_ROLE)
  if (authError) return authError

  const { id } = await params

  try {
    const res = await getProductRecipe(id)
    return jsonSuccess(res.data)
  } catch (err) {
    // A product with no recipe yet returns 404 upstream — the status is passed
    // through so the client can render an empty editor instead of an error.
    return handleUpstreamError(err, "Recipe not found for this product", 404)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAuth(RECIPE_ROLE)
  if (authError) return authError

  const { id } = await params

  const parsed = await readJsonBody(request, recipeFormSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await upsertProductRecipe(id, parsed.data)
    return jsonSuccess(res.data)
  } catch (err) {
    // 400 — unit mismatch, cross-restaurant ingredient, or duplicate entries.
    return handleUpstreamError(err, "Failed to save recipe")
  }
}
