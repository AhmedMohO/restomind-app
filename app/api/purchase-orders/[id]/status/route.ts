import { connection } from "next/server"

import { updatePurchaseOrderStatus } from "@/features/purchase-orders/api"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const MANAGER_ROLES = ["manager", "admin"] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  const { id } = await params

  try {
    const { status } = await request.json()
    const res = await updatePurchaseOrderStatus(id, status)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update purchase order status")
  }
}
