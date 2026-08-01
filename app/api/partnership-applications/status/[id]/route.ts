import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  checkPartnershipApplicationStatus,
  type PartnershipApplicationStatusResult,
} from "@/features/partner/api"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Email is required" },
      { status: 400 }
    )
  }

  try {
    const data = await checkPartnershipApplicationStatus(id, email)
    return NextResponse.json<ApiResponse<PartnershipApplicationStatusResult>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/partnership-applications/status/[id]] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "NOT_FOUND",
        message:
          err instanceof Error
            ? err.message
            : "Application not found or email does not match",
      },
      { status: 404 }
    )
  }
}
