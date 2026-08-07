import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { markAllAsReadServer } from "@/features/notifications/api/server-notifications"

export async function PATCH() {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  try {
    const res = await markAllAsReadServer()
    return NextResponse.json<ApiResponse<{ message: string }>>(
      { success: true, data: { message: res.message } },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/notifications/read-all] PATCH failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to mark all notifications as read",
      },
      { status: 500 }
    )
  }
}
