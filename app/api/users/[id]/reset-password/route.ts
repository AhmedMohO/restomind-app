import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import { resetUserPassword } from "@/features/users/api"
import {
  handleUpstreamError,
  requireSessionUser,
} from "@/lib/api/route-helpers"

/**
 * POST /api/users/:id/reset-password — send a password reset email link.
 *
 * Managers may only reset passwords for staff belonging to their own
 * restaurant; that check lives upstream, which rejects out-of-scope ids
 * with a 403.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["admin", "manager"])
  if (!auth.ok) return auth.response

  const { id } = await params

  try {
    const result = await resetUserPassword(id)
    return NextResponse.json<ApiResponse<{ message: string }>>(
      { success: true, data: result },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/users/[id]/reset-password] POST failed", err)
    return handleUpstreamError(err, "Failed to send password reset link")
  }
}
