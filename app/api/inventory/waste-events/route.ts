import { connection } from "next/server"

import { createWasteEvent, getWasteEvents } from "@/features/inventory/api"
import type { WasteReasonEnum } from "@/features/inventory/types"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { createWasteEventSchema } from "@/schemas/inventory"

const INVENTORY_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(INVENTORY_ROLES)
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

  const authError = await requireAnyRole(INVENTORY_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, createWasteEventSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createWasteEvent(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to log waste event")
  }
}
