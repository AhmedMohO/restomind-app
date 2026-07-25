import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  ORDER_DASHBOARD_ROLES,
  getDashboardOrderGroup,
} from "@/features/orders/api/dashboard"
import { handleUpstreamError, requireSessionUser } from "@/lib/api/route-helpers"
import type { ApiOrderGroup } from "@/features/orders/api/type"

/**
 * GET /api/orders/group/:id — order group details for the dashboard.
 *
 * Managers and staff only ever see the sub-orders of their own restaurant.
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
    const data = await getDashboardOrderGroup(auth.user, id)
    return NextResponse.json<ApiResponse<ApiOrderGroup>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/group/[id]] GET failed", err)
    return handleUpstreamError(err, "Order group not found", 404)
  }
}
