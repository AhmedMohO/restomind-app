import { NextResponse, connection } from "next/server"
import { getMySubscription } from "@/features/subscription/api"
import type { ApiResponse } from "@/features/auth/auth"
import type { MySubscription } from "@/features/subscription/api/type"
import { requireAuth } from "@/lib/api/route-helpers"

export async function GET() {
  await connection()

  const authError = await requireAuth()
  if (authError) return authError

  try {
    const subscription = await getMySubscription()
    return NextResponse.json<ApiResponse<MySubscription>>(
      { success: true, data: subscription },
      { status: 200 }
    )
  } catch (error) {
    console.error("[api/subscriptions/me] Unexpected error", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve subscription details",
      },
      { status: 500 }
    )
  }
}
