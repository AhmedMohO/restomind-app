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
    // `WeeklyPredictionService.recalculateSingle` (weekly-prediction.service.ts)
    // returns `{ data: prediction, ...degradationFields(degradation) }` — the
    // `degraded`/`degradedReason`/`degradedKind`/`degradedStatus` fields sit
    // alongside `data`, not inside it, same as production-plan's two routes.
    // `jsonSuccess(body.data ?? body)` would silently drop them whenever
    // `data` is present (the common case), which is exactly the "siblings
    // dropped" failure shape. Pass the whole envelope through instead.
    const body = await parseOrThrow<Record<string, unknown>>(
      response,
      "recalculate"
    )
    return jsonSuccess(body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to recalculate prediction")
  }
}
