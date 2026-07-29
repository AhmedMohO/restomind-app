import { connection } from "next/server"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { recalculatePredictionSchema } from "@/schemas/prediction"

export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, recalculatePredictionSchema)
  if (!parsed.ok) return parsed.response

  try {
    const response = await apiClient("/predictions/recalculate", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })
    const body = await parseOrThrow<{ data?: unknown }>(response, "recalculate")
    return jsonSuccess(body.data ?? body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to recalculate prediction")
  }
}
