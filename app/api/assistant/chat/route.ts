import { connection } from "next/server"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { assistantChatSchema } from "@/schemas/assistant"

// The agent plans, runs tools and calls Bedrock twice — well past the 15s
// default budget.
export const maxDuration = 120

export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(["admin", "manager", "staff"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, assistantChatSchema)
  if (!parsed.ok) return parsed.response

  try {
    const response = await apiClient("/assistant/chat", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })
    const body = await parseOrThrow<Record<string, unknown>>(
      response,
      "assistantChat"
    )
    return jsonSuccess(body)
  } catch (err) {
    // 429 (AiThrottle) is a state the UI must distinguish from a generic
    // failure — handleUpstreamError preserves the upstream status.
    return handleUpstreamError(err, "Failed to reach the assistant")
  }
}
