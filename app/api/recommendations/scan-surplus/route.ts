import { connection } from "next/server"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

// The scan walks recipes and inventory, then calls the AI with an 8s budget.
export const maxDuration = 120

export async function POST() {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  try {
    const response = await apiClient("/recommendations/scan-surplus", {
      method: "POST",
    })
    // The upstream returns { data, degraded, degradedReason } — pass the whole
    // envelope through so the UI can show the degraded banner.
    const body = await parseOrThrow<Record<string, unknown>>(
      response,
      "scanSurplus"
    )
    return jsonSuccess(body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to scan for surplus")
  }
}
