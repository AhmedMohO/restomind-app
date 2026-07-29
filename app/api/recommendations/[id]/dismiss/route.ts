import { connection } from "next/server"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const { id } = await params

  try {
    const response = await apiClient(`/recommendations/${id}/dismiss`, {
      method: "PATCH",
    })
    const body = await parseOrThrow<Record<string, unknown>>(response, "dismiss")
    return jsonSuccess(body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to dismiss recommendation")
  }
}
