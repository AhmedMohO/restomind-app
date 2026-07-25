import { connection } from "next/server"

import {
  deleteIngredient,
  getIngredientById,
  updateIngredient,
} from "@/features/ingredients/api"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAuth,
} from "@/lib/api/route-helpers"
import { ingredientUpdateSchema } from "@/schemas/ingredient"

const INGREDIENT_ROLE = "manager" as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAuth(INGREDIENT_ROLE)
  if (authError) return authError

  const { id } = await params

  try {
    const res = await getIngredientById(id)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleUpstreamError(err, "Ingredient not found", 404)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAuth(INGREDIENT_ROLE)
  if (authError) return authError

  const { id } = await params

  const parsed = await readJsonBody(request, ingredientUpdateSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await updateIngredient(id, parsed.data)
    return jsonSuccess(res.data)
  } catch (err) {
    // 409 — another ingredient in this restaurant already uses that code.
    return handleUpstreamError(err, "Failed to update ingredient")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAuth(INGREDIENT_ROLE)
  if (authError) return authError

  const { id } = await params

  try {
    const res = await deleteIngredient(id)
    return jsonSuccess({ message: res.message })
  } catch (err) {
    // 400 — the ingredient is still referenced by an active recipe.
    return handleUpstreamError(err, "Failed to delete ingredient")
  }
}
