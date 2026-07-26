import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import { cancelOrderGroup } from "@/features/orders/api"
import { handleUpstreamError, requireSessionUser } from "@/lib/api/route-helpers"
import type { ApiOrderGroup } from "@/features/orders/api/type"

/**
 * PATCH /api/orders/group/:id/cancel — cancels a group order.
 * Allowed for customers (who own the order) and admins.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["customer", "admin"])
  if (!auth.ok) return auth.response

  const { id } = await params

  try {
    const result = await cancelOrderGroup(id)
    return NextResponse.json<ApiResponse<ApiOrderGroup>>(
      { success: true, data: result.data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/orders/group/[id]/cancel] PATCH failed", err)
    return handleUpstreamError(err, "Failed to cancel order")
  }
}
