import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import { updateOrderStatus } from "@/features/orders/api"
import type { ApiRestaurantOrder, OrderStatus } from "@/features/orders/api/type"

const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  const role = session.user.role as UserRole
  if (role !== "admin" && role !== "manager") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Admin or manager role required" },
      { status: 403 }
    )
  }

  let body: { status?: OrderStatus }
  try {
    body = (await request.json()) as { status?: OrderStatus }
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  if (!body.status || !ORDER_STATUSES.includes(body.status)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid order status" },
      { status: 400 }
    )
  }

  const { id } = await params

  try {
    const result = await updateOrderStatus(id, body.status)
    return NextResponse.json<ApiResponse<ApiRestaurantOrder>>(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/[id]/status] PATCH failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to update order status",
      },
      { status: 500 }
    )
  }
}
