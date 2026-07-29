import { connection } from "next/server"

import { createWasteEvent, getWasteEvents } from "@/features/inventory/api"
import type { WasteReasonEnum } from "@/features/inventory/types"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const MANAGER_ROLES = ["manager", "admin"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const ingredientId = searchParams.get("ingredientId") ?? undefined
  const wasteReason =
    (searchParams.get("wasteReason") as WasteReasonEnum) ?? undefined

  try {
    const data = await getWasteEvents({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(ingredientId ? { ingredientId } : {}),
      ...(wasteReason ? { wasteReason } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleServerError(err, "Failed to fetch waste events")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  try {
    const body = await request.json()
    const res = await createWasteEvent(body)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to log waste event")
  }
}
