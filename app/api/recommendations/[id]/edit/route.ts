import { connection } from "next/server"

import { apiClient } from "@/lib/api/client"
import { parseOrThrow } from "@/lib/api/utils"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { editRecommendationSchema } from "@/schemas/recommendation"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const { id } = await params
  const parsed = await readJsonBody(request, editRecommendationSchema)
  if (!parsed.ok) return parsed.response

  try {
    const response = await apiClient(`/recommendations/${id}/edit`, {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    })
    const body = await parseOrThrow<Record<string, unknown>>(response, "edit")
    return jsonSuccess(body)
  } catch (err) {
    return handleUpstreamError(err, "Failed to edit recommendation")
  }
}
