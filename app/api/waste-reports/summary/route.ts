import { connection } from "next/server"

import { getWasteSummary } from "@/features/waste/api"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

const MIN_DAYS = 1
const MAX_DAYS = 365
const DEFAULT_DAYS = 30

/** Mirrors the backend's own clamp (1..365, default 30) — the brief is
 * explicit this route should clamp, not reject, since the upstream service
 * already substitutes the default for anything out of range. */
function clampDays(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DAYS
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.trunc(n)))
}

export async function GET(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const days = clampDays(searchParams.get("days"))

  try {
    const data = await getWasteSummary(days)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch waste summary")
  }
}
