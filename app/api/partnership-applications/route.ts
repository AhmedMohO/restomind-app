import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  getPartnershipApplications,
  type PaginatedPartnershipApplications,
} from "@/features/partner/api"
import { requireAdmin } from "@/lib/api/route-helpers"

export async function GET(request: Request) {
  await connection()

  const authError = await requireAdmin()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const status = searchParams.get("status") ?? undefined

  try {
    const data = await getPartnershipApplications({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(status ? { status } : {}),
    })
    return NextResponse.json<ApiResponse<PaginatedPartnershipApplications>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/partnership-applications] GET failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Failed to fetch applications",
      },
      { status: 500 }
    )
  }
}
