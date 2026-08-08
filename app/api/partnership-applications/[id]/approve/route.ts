import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import { approvePartnershipApplication } from "@/features/partner/api"
import { requireAdmin } from "@/lib/api/route-helpers"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  try {
    const data = await approvePartnershipApplication(id)
    return NextResponse.json<
      ApiResponse<{
        message: string
        userId: string
        restaurantId: string
        status: string
      }>
    >({ success: true, data }, { status: 200 })
  } catch (err) {
    console.error("[api/partnership-applications/[id]/approve] POST failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "ACTION_FAILED",
        message: err instanceof Error ? err.message : "Failed to approve application",
      },
      { status: 400 }
    )
  }
}
