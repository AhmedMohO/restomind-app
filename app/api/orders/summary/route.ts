import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  ORDER_DASHBOARD_ROLES,
  getDashboardOrdersSummary,
  parseOrderListingParams,
} from "@/features/orders/api/dashboard"
import { handleUpstreamError, requireSessionUser } from "@/lib/api/route-helpers"
import type { DashboardOrdersSummary } from "@/features/orders/api/dashboard-types"

/**
 * GET /api/orders/summary — completion counters for the dashboard header.
 *
 * Accepts the same filters as `GET /api/orders` so the ratio always describes
 * the orders currently listed.
 */
export async function GET(request: Request) {
  await connection()

  const auth = await requireSessionUser(ORDER_DASHBOARD_ROLES)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)

  try {
    const data = await getDashboardOrdersSummary(
      auth.user,
      parseOrderListingParams(searchParams)
    )
    return NextResponse.json<ApiResponse<DashboardOrdersSummary>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/summary] GET failed", err)
    return handleUpstreamError(err, "Failed to fetch order totals")
  }
}
