import { connection } from "next/server"

import { createBatch, getBatches } from "@/features/inventory/api"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

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

  try {
    const body = await request.json()
    const res = await createBatch(body)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create inventory batch")
  }
}
