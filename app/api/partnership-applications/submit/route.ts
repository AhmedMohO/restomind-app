import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  submitPartnershipApplication,
  type PartnershipApplicationItem,
} from "@/features/partner/api"
import { readJsonBody } from "@/lib/api/route-helpers"
import { createPartnershipSchema } from "@/schemas/partnership"

export async function POST(request: Request) {
  await connection()

  const parsed = await readJsonBody(request, createPartnershipSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await submitPartnershipApplication(parsed.data)
    return NextResponse.json<
      ApiResponse<{ message: string; application: PartnershipApplicationItem }>
    >({ success: true, data: res }, { status: 201 })
  } catch (err) {
    console.error("[api/partnership-applications/submit] POST failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "SUBMIT_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "Failed to submit partnership application",
      },
      { status: 400 }
    )
  }
}
