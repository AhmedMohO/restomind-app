/**
 * GET /api/auth/socket-token
 *
 * BFF endpoint returning the user's active JWT access token from Iron Session
 * so client-side WebSocket managers can establish live Socket.IO connections.
 * The token is kept in-memory on the client during the socket session.
 */

import { NextResponse, connection } from "next/server"
import { getSession, isAuthenticated } from "@/lib/auth/session"
import { API_URL } from "@/lib/auth/config"

export async function GET() {
  await connection()

  try {
    const session = await getSession()

    if (!isAuthenticated(session) || !session.tokens?.accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Not authenticated" },
        { status: 401 }
      )
    }

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || API_URL || "http://localhost:4000"

    // Upgrade to HTTPS/WSS in production to prevent Mixed Content blocking
    if (process.env.NODE_ENV === "production") {
      wsUrl = wsUrl.replace(/^http:\/\//, "https://")
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          token: session.tokens.accessToken,
          wsUrl,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[auth/socket-token] Unexpected error", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to retrieve socket token",
      },
      { status: 500 }
    )
  }
}
