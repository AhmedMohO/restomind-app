import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import {
  submitPartnershipApplication,
  type CreatePartnershipPayload,
  type PartnershipApplicationItem,
} from "@/features/partner/api"

export async function POST(request: Request) {
  await connection()

  let body: CreatePartnershipPayload
  try {
    body = (await request.json()) as CreatePartnershipPayload
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  try {
    const res = await submitPartnershipApplication(body)
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
