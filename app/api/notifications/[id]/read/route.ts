import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { markAsReadServer } from "@/features/notifications/api/server-notifications"
import type { NotificationItem } from "@/features/notifications/types"

export async function PATCH(
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

  const { id } = await params
  if (!id) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Notification ID is required" },
      { status: 400 }
    )
  }

  try {
    const res = await markAsReadServer(id)
    return NextResponse.json<ApiResponse<NotificationItem>>(
      { success: true, data: res.data },
      { status: 200 }
    )
  } catch (err) {
    console.error(`[api/notifications/${id}/read] PATCH failed`, err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to mark notification as read",
      },
      { status: 500 }
    )
  }
}
