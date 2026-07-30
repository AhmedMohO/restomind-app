import { connection } from "next/server"

import { recordProductionPlanActuals } from "@/features/production-plan/api"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { recordActualsSchema } from "@/schemas/production-plan"

export async function POST(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, recordActualsSchema)
  if (!parsed.ok) return parsed.response

  try {
    const body = await recordProductionPlanActuals(parsed.data)
    // Pass the WHOLE upstream envelope through, same reasoning as the GET
    // route above: `applied`/`skipped` sit alongside `data`, not inside it.
    // `jsonSuccess(body.data ?? body)` would silently drop the very arrays
    // Step 3 of the brief requires reporting — a productId in `skipped` was
    // not part of the plan and must surface as a per-row error, never a
    // bare success.
    return jsonSuccess(body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to record actuals")
  }
}
