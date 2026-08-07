import { connection } from "next/server"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { assistantApproveActionSchema } from "@/schemas/assistant"

// Approving runs the real tool (create offer / PO / production plan).
export const maxDuration = 120

export async function POST(request: Request) {
  await connection()

  // Mirrors the backend guard: staff may chat, but only admin/manager may
  // execute an action.
  const auth = await requireSessionUser(["admin", "manager"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, assistantApproveActionSchema)
  if (!parsed.ok) return parsed.response

  try {
    const response = await apiClient("/assistant/approve-action", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })
    const body = await parseOrThrow<Record<string, unknown>>(
      response,
      "assistantApproveAction"
    )
    return jsonSuccess(body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to execute the approved action")
  }
}
