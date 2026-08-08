import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  markPartnershipUnderReview,
  type PartnershipApplicationItem,
} from "@/features/partner/api"
import { requireAdmin } from "@/lib/api/route-helpers"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  try {
    const data = await markPartnershipUnderReview(id)
    return NextResponse.json<ApiResponse<PartnershipApplicationItem>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/partnership-applications/[id]/review] PATCH failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "ACTION_FAILED",
        message:
          err instanceof Error ? err.message : "Failed to mark application under review",
      },
      { status: 400 }
    )
  }
}
