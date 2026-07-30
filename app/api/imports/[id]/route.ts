import { connection } from "next/server"

import { getImportJobById } from "@/features/imports/api"
import {
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

/** GET /imports/:id — a single job's full detail, including its row errors. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["manager", "admin"])
  if (!auth.ok) return auth.response

  const { id } = await params

  try {
    const data = await getImportJobById(id)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch import job")
  }
}
