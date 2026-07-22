/**
 * GET /api/profile
 *
 * BFF endpoint returning the full authenticated user profile (including avatar image).
 */

import { NextResponse, connection } from "next/server"
import { getProfileApi } from "@/features/profile/api/profile"
import type { ApiResponse } from "@/features/auth/auth"
import type { FullUser } from "@/features/profile/api/profile"

export async function GET() {
  await connection()

  try {
    const user = await getProfileApi()
    return NextResponse.json<ApiResponse<FullUser>>(
      { success: true, data: user },
      { status: 200 }
    )
  } catch (error) {
    console.error("[api/profile] Unexpected error", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to retrieve profile",
      },
      { status: 500 }
    )
  }
}
