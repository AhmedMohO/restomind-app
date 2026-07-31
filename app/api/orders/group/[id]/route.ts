import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  ORDER_DASHBOARD_ROLES,
  getDashboardChildOrder,
  getDashboardOrderGroup,
} from "@/features/orders/api/dashboard"
import { handleUpstreamError, requireSessionUser } from "@/lib/api/route-helpers"
import type { ApiChildOrder, ApiOrderGroup } from "@/features/orders/api/type"

/**
 * GET /api/orders/group/:id — order details for the dashboard.
 *
 * Admins reach `GET /orders/group/:id`.
 * Managers and staff reach `GET /orders/:id` via getDashboardChildOrder.
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
    const data =
      auth.user.role === "admin"
        ? await getDashboardOrderGroup(auth.user, id)
        : await getDashboardChildOrder(auth.user, id)

    return NextResponse.json<ApiResponse<ApiOrderGroup | ApiChildOrder>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/group/[id]] GET failed", err)
    return handleUpstreamError(err, "Order not found", 404)
  }
}

