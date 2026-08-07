import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { getUnreadCountServer } from "@/features/notifications/api/server-notifications"
import type { UnreadCountData } from "@/features/notifications/types"

export async function GET() {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  try {
    const res = await getUnreadCountServer()
    return NextResponse.json<ApiResponse<UnreadCountData>>(
      { success: true, data: res.data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/notifications/unread-count] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to fetch unread count",
      },
      { status: 500 }
    )
  }
}
