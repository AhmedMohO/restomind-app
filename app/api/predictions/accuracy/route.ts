import { connection } from "next/server"

import { getAccuracy } from "@/features/predictions/api"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

const DEFAULT_WEEKS = 8
const MIN_WEEKS = 1
const MAX_WEEKS = 52

/**
 * Clamps `?weeks=` into [1, 52], falling back to the default on anything
 * missing or non-numeric. Unlike `parsePredictionsQuery` — which rejects an
 * out-of-range filter with a 400 because it changes *which* records come
 * back — this is a single display-range knob (how many trailing weeks of
 * accuracy to chart), so silently clamping to a sane range is preferable to
 * bouncing the request.
 */
function clampWeeks(value: string | null): number {
  if (value === null) return DEFAULT_WEEKS
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_WEEKS
  return Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, Math.floor(n)))
}

export async function GET(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const weeks = clampWeeks(searchParams.get("weeks"))

  try {
    return jsonSuccess(await getAccuracy(weeks))
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch prediction accuracy")
  }
}
