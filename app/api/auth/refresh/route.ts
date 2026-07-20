/**
 * POST /api/auth/refresh
 *
 * Manually triggers an access token refresh.
 * In normal operation, the apiClient() refreshes proactively and this
 * endpoint is not needed. It exists as an escape hatch for client-side
 * code that needs to force a refresh (e.g. after a 401 on a client fetch).
 */

import { NextResponse } from "next/server"

import { refreshSession } from "@/lib/auth/refresh"
import {
  AuthenticationError,
  RefreshTokenExpiredError,
} from "@/lib/auth/errors"
import type { ApiResponse } from "@/features/auth/auth"

export async function POST() {
  try {
    await refreshSession()

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Token refreshed successfully" },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof RefreshTokenExpiredError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Refresh Token Expired", message: error.message },
        { status: 401 }
      )
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Authentication Error", message: error.message },
        { status: 401 }
      )
    }

    console.error("[auth/refresh] Unexpected error", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal Server Error",
        message: "An unexpected error occurred during token refresh",
      },
      { status: 500 }
    )
  }
}
