import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import {
  rejectPartnershipApplication,
  type PartnershipApplicationItem,
} from "@/features/partner/api"

export async function POST(
  request: Request,
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
  let body: { reason?: string }
  try {
    body = (await request.json()) as { reason?: string }
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  if (!body.reason || !body.reason.trim()) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Rejection reason is required" },
      { status: 400 }
    )
  }

  try {
    const data = await rejectPartnershipApplication(id, body.reason)
    return NextResponse.json<ApiResponse<PartnershipApplicationItem>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/partnership-applications/[id]/reject] POST failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "ACTION_FAILED",
        message: err instanceof Error ? err.message : "Failed to reject application",
      },
      { status: 400 }
    )
  }
}
