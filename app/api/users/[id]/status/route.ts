import { NextResponse, connection } from "next/server"
import { z } from "zod"
import type { ApiResponse } from "@/features/auth/auth"
import { updateUserStatus } from "@/features/users/api"
import {
  handleUpstreamError,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"

const statusSchema = z.object({
  isActive: z.boolean(),
})

/**
 * PATCH /api/users/:id/status — activate/deactivate a user.
 *
 * Managers may only update status of staff belonging to their own
 * restaurant; that check lives upstream, which rejects out-of-scope ids
 * with a 403.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["admin", "manager"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, statusSchema)
  if (!parsed.ok) return parsed.response

  const { id } = await params

  try {
    const result = await updateUserStatus(id, parsed.data.isActive)
    const userData = (result as Record<string, unknown>)?.data ?? result
    return NextResponse.json<ApiResponse>({ success: true, data: userData }, { status: 200 })
  } catch (err) {
    console.error("[api/users/[id]/status] PATCH failed", err)
    return handleUpstreamError(err, "Failed to update user status")
  }
}
