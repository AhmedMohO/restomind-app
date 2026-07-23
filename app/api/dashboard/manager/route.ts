import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { getManagerDashboardStats, type ManagerDashboardStatsResponse } from "@/features/analytics/api"
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

  if (session.user.role !== "manager" && session.user.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Manager access required" },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate") ?? undefined
  const endDate = searchParams.get("endDate") ?? undefined

  try {
    const data = await getManagerDashboardStats({ startDate, endDate })
    return NextResponse.json<ApiResponse<ManagerDashboardStatsResponse>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/dashboard/manager] GET failed:", err)
    const status = err instanceof ApiError ? err.statusCode : 500
    const message = err instanceof Error ? err.message : "Failed to fetch manager dashboard stats"
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
