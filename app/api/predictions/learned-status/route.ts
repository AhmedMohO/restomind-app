import { connection } from "next/server"

import { getLearnedStatus } from "@/features/predictions/api"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

export async function GET() {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  try {
    return jsonSuccess(await getLearnedStatus())
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch AI learning status")
  }
}
