import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import { getOrderGroupById } from "@/features/orders/api"
import type { ApiOrderGroup } from "@/features/orders/api/type"

export async function GET(
  _request: Request,
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
  if (role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Admin role required" },
      { status: 403 }
    )
  }

  const { id } = await params

  try {
    const result = await getOrderGroupById(id)
    return NextResponse.json<ApiResponse<ApiOrderGroup>>(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/group/[id]] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "NOT_FOUND",
        message: err instanceof Error ? err.message : "Order group not found",
      },
      { status: 404 }
    )
  }
}
