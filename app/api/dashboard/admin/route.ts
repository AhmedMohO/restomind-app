import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { getAdminDashboardStats, type DashboardStatsResponse } from "@/features/analytics/api"
import { ApiError } from "@/lib/auth/errors"

export async function GET(request: Request) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  if (session.user.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate") ?? undefined
  const endDate = searchParams.get("endDate") ?? undefined

  try {
    const data = await getAdminDashboardStats({ startDate, endDate })
    return NextResponse.json<ApiResponse<DashboardStatsResponse>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/dashboard/admin] GET failed:", err)
    const status = err instanceof ApiError ? err.statusCode : 500
    const message = err instanceof Error ? err.message : "Failed to fetch admin dashboard stats"
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message,
      },
      { status }
    )
  }
}
