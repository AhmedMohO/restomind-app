import { connection } from "next/server"

import { retryAiIngest } from "@/features/imports/api"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

/**
 * POST /imports/:id/retry-ai-ingest — only meaningful for a `sales_history`
 * job stuck in `ai_ingest_failed`. The backend 400s for any other import
 * type ("Retry AI ingest is only applicable for sales_history imports") and
 * when no written transactions exist for the job — both preserved via
 * `handleUpstreamError` rather than collapsed to a generic 500.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["manager", "admin"])
  if (!auth.ok) return auth.response

  const { id } = await params

  try {
    const data = await retryAiIngest(id)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to retry AI ingest")
  }
}
