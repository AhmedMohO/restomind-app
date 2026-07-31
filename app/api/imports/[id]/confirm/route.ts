import { connection } from "next/server"

import { confirmImportJob } from "@/features/imports/api"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

/**
 * POST /imports/:id/confirm — deliberately takes no request body. The
 * client never sends `columnMapping` (brief Step 1: no manual mapping
 * editor), so this route doesn't even parse one; `confirmImportJob` calls
 * upstream with no body, and the backend falls back to the
 * `autoSuggestMapping` result stored on the job at upload time.
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
    const data = await confirmImportJob(id)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to confirm import job")
  }
}
