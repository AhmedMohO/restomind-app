import { connection } from "next/server"

import { createIngredient, getIngredients } from "@/features/ingredients/api"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAuth,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { ingredientFormSchema } from "@/schemas/ingredient"

/** Ingredient writes are manager-only; reads allow admin/manager/staff. */
const INGREDIENT_READ_ROLES = ["admin", "manager", "staff"] as const
const INGREDIENT_ROLE = "manager" as const

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100

/** Clamps a query param to a positive integer, falling back when absent/invalid. */
function toPositiveInt(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  const int = Math.floor(parsed)
  return max ? Math.min(int, max) : int
}

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(INGREDIENT_READ_ROLES)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim()

  try {
    const data = await getIngredients({
      page: toPositiveInt(searchParams.get("page"), 1),
      limit: toPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT),
      ...(search ? { search } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch ingredients")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAuth(INGREDIENT_ROLE)
  if (authError) return authError

  const parsed = await readJsonBody(request, ingredientFormSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createIngredient(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    // 409 — ingredient code already exists in this restaurant.
    return handleUpstreamError(err, "Failed to create ingredient")
  }
}
