import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse } from "@/features/auth/auth"
import {
  getPartnershipApplicationById,
  type PartnershipApplicationItem,
} from "@/features/partner/api"

export async function GET(
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
    const data = await getPartnershipApplicationById(id)
    return NextResponse.json<ApiResponse<PartnershipApplicationItem>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/partnership-applications/[id]] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "NOT_FOUND",
        message: err instanceof Error ? err.message : "Application not found",
      },
      { status: 404 }
    )
  }
}
