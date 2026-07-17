/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile from the Iron Session.
 * This is the BFF endpoint that the AuthProvider fetches on the client.
 *
 * The session is read server-side — the browser never sees the JWT tokens.
 * Only the non-sensitive user fields are returned.
 */

import { NextResponse, connection } from "next/server"

import { getSession } from "@/lib/auth/session"
import type { ApiResponse, SessionUser } from "@/features/auth/auth"

export async function GET() {
  await connection();

  try {
    const session = await getSession()

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized", message: "Not authenticated" },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse<{ user: SessionUser }>>(
      { success: true, data: { user: session.user } },
      { status: 200 }
    )
  } catch (error) {
    console.error("[auth/me] Unexpected error", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to retrieve session",
      },
      { status: 500 }
    )
  }
}
