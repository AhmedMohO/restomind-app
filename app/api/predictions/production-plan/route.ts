import { connection } from "next/server"

import { getProductionPlan } from "@/features/production-plan/api"
import {
  handleServerError,
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Generation on a cold AI can take up to ~30s (brief, Step 4). This is a
// serverless hint only — a self-hosted Node server ignores it — but it
// documents the real budget and matches the client's own 45s timeout with
// headroom to spare.
export const maxDuration = 45

export async function GET(request: Request) {
  await connection()

  const auth = await requireSessionUser(["admin", "manager", "staff"])
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  if (!date || !DATE_RE.test(date)) {
    return handleServerError("date must be YYYY-MM-DD", "date must be YYYY-MM-DD", 400)
  }

  try {
    // Bounds the BFF's own wait below the client's 45s timeout so a stalled
    // upstream socket can't hang this route indefinitely.
    const body = await getProductionPlan(date, AbortSignal.timeout(40_000))
    // Pass the WHOLE upstream envelope through — `degraded`/`degradedReason`
    // sit alongside `data`, not inside it. `jsonSuccess(body.data ?? body)`
    // (the sibling predictions/recommendations pattern for simple GETs)
    // would silently drop them here. See features/production-plan/api/index.ts.
    return jsonSuccess(body)
  } catch (err) {
    // A 404 (no plan generated for a past date) and a 400 (beyond the
    // 14-day horizon) are real, final answers the UI renders as empty
    // states/messages, not errors — handleUpstreamError preserves both
    // status codes instead of collapsing them to 500.
    return handleUpstreamError(err, "Failed to fetch the production plan")
  }
}
