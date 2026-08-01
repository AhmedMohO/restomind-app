import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import { resendApprovalEmail } from "@/features/partner/api"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user || session.user.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Admin access required" },
      { status: 401 }
    )
  }

  const { id } = await params

  try {
    const data = await resendApprovalEmail(id)
    return NextResponse.json<ApiResponse<{ message: string }>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error(
      "[api/partnership-applications/[id]/resend-approval-email] POST failed",
      err
    )
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "ACTION_FAILED",
        message: err instanceof Error ? err.message : "Failed to resend approval email",
      },
      { status: 400 }
    )
  }
}
