import { connection } from "next/server"

import { updatePurchaseOrderStatus } from "@/features/purchase-orders/api"
import {
  handleServerError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { updatePurchaseOrderStatusSchema } from "@/schemas/purchase-order"

const MANAGER_ROLES = ["manager", "admin"] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, updatePurchaseOrderStatusSchema)
  if (!parsed.ok) return parsed.response

  const { id } = await params

  try {
    const res = await updatePurchaseOrderStatus(id, parsed.data.status)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update purchase order status")
  }
}
