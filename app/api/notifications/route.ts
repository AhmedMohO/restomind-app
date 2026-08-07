import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { getUserNotificationsServer } from "@/features/notifications/api/server-notifications"
import type { PaginatedNotifications } from "@/features/notifications/types"

export async function GET(request: Request) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined
  const isRead = searchParams.has("isRead")
    ? searchParams.get("isRead") === "true"
    : undefined
  const type = searchParams.get("type") ?? undefined
  const createdAfter = searchParams.get("createdAfter") ?? undefined
  const createdBefore = searchParams.get("createdBefore") ?? undefined
  const sortBy = (searchParams.get("sortBy") as "createdAt" | "readAt") ?? undefined
  const order = (searchParams.get("order") as "asc" | "desc") ?? undefined

  try {
    const data = await getUserNotificationsServer({
      page,
      limit,
      isRead,
      type,
      createdAfter,
      createdBefore,
      sortBy,
      order,
    })

    return NextResponse.json<ApiResponse<PaginatedNotifications>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/notifications] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to fetch notifications",
      },
      { status: 500 }
    )
  }
}
