import { connection } from "next/server"

import { getRecommendations } from "@/features/recommendations/api"
import { parseRecommendationsQuery } from "@/features/recommendations/api/query"
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
  const parsed = parseRecommendationsQuery(searchParams)
  if (!parsed.ok) return handleServerError(parsed.message, parsed.message, 400)

  try {
    const data = await getRecommendations(parsed.params)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch recommendations")
  }
}
