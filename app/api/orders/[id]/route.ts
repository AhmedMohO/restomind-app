import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  ORDER_DASHBOARD_ROLES,
  getDashboardChildOrder,
} from "@/features/orders/api/dashboard"
import { handleUpstreamError, requireSessionUser } from "@/lib/api/route-helpers"
import type { ApiChildOrder } from "@/features/orders/api/type"

/**
 * GET /api/orders/:id — child order details for manager, admin, or customer.
 * Uses `GET /orders/:id` backend endpoint (orders.controller.ts:L64-L73).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(ORDER_DASHBOARD_ROLES)
  if (!auth.ok) return auth.response

  const { id } = await params

  try {
    const data = await getDashboardChildOrder(auth.user, id)
    return NextResponse.json<ApiResponse<ApiChildOrder>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/[id]] GET failed", err)
    return handleUpstreamError(err, "Child order not found", 404)
  }
}
