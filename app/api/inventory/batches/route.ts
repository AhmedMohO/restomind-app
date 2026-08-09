import { connection } from "next/server"

import { createBatch, getBatches } from "@/features/inventory/api"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { createBatchOrBatchesSchema } from "@/schemas/inventory"

const INVENTORY_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(INVENTORY_ROLES)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const ingredientId = searchParams.get("ingredientId") ?? undefined

  try {
    const data = await getBatches({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(ingredientId ? { ingredientId } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleServerError(err, "Failed to fetch inventory batches")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(INVENTORY_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, createBatchOrBatchesSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createBatch(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create inventory batch")
  }
}
