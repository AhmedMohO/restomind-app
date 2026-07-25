import { NextResponse, connection } from "next/server"
import { z } from "zod"
import type { ApiResponse } from "@/features/auth/auth"
import { updateOrderStatus } from "@/features/orders/api"
import { ORDER_DASHBOARD_ROLES } from "@/features/orders/api/dashboard"
import {
  handleUpstreamError,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import type { ApiRestaurantOrder } from "@/features/orders/api/type"

const statusSchema = z.object({
  status: z.enum([
    "Pending",
    "Confirmed",
    "Preparing",
    "Ready",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
  ]),
})

/**
 * PATCH /api/orders/:id/status — updates a sub-order status.
 *
 * Managers and staff may only update orders of their own restaurant; that check
 * lives upstream, which rejects out-of-scope ids with a 403.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(ORDER_DASHBOARD_ROLES)
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, statusSchema)
  if (!parsed.ok) return parsed.response

  const { id } = await params
  const groupOrderId = new URL(request.url).searchParams.get("groupOrderId")

  try {
    const result = await updateOrderStatus(
      id,
      parsed.data.status,
      groupOrderId ?? undefined
    )
    return NextResponse.json<ApiResponse<ApiRestaurantOrder>>(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/[id]/status] PATCH failed", err)
    return handleUpstreamError(err, "Failed to update order status")
  }
}
