import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import { getAllOrders } from "@/features/orders/api"
import type { PaginatedAdminOrders, QueryOrderListingParams } from "@/features/orders/api/dashboard-types"

const QUERY_KEYS = [
  "page",
  "limit",
  "search",
  "status",
  "paymentMethod",
  "deliveryMethod",
  "startDate",
  "endDate",
  "minTotalPrice",
  "maxTotalPrice",
  "restaurantId",
  "sortBy",
  "sort",
  "sortOrder",
  "order",
] as const

export async function GET(request: Request) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  const role = session.user.role as UserRole
  if (role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Admin role required" },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const params: QueryOrderListingParams = {}

  for (const key of QUERY_KEYS) {
    const value = searchParams.get(key)
    if (!value) continue
    if (key === "page" || key === "limit" || key === "minTotalPrice" || key === "maxTotalPrice") {
      params[key] = Number(value)
    } else {
      params[key] = value as never
    }
  }

  try {
    const data = await getAllOrders(params)
    return NextResponse.json<ApiResponse<PaginatedAdminOrders>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to fetch orders",
      },
      { status: 500 }
    )
  }
}
