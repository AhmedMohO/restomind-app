import { connection } from "next/server"

import { changeProductAvailability } from "@/features/products/api"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const PRODUCT_ROLES = ["admin", "manager"] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  const { id } = await params

  try {
    const body = (await request.json()) as { isAvailable?: boolean }
    const res = await changeProductAvailability(id, Boolean(body.isAvailable))
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update product availability")
  }
}
