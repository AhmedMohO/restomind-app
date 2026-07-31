import { connection } from "next/server"

import { getPredictions } from "@/features/predictions/api"
import { parsePredictionsQuery } from "@/features/predictions/api/query"
import {
  handleServerError,
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

export async function GET(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const parsed = parsePredictionsQuery(searchParams)
  if (!parsed.ok) return handleServerError(parsed.message, parsed.message, 400)

  try {
    const data = await getPredictions(parsed.params)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch predictions")
  }
}
