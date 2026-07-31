import { connection } from "next/server"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { aiBackfillSchema } from "@/schemas/prediction"

// Batch recalculation walks every product with retries against the AI service.
// The default serverless budget is far too short for it.
export const maxDuration = 300

export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, aiBackfillSchema)
  if (!parsed.ok) return parsed.response

  try {
    const response = await apiClient("/predictions/ai-backfill", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })
    const body = await parseOrThrow<{ data?: unknown }>(response, "aiBackfill")
    return jsonSuccess(body.data ?? body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to backfill AI predictions")
  }
}
