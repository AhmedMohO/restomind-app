import { connection } from "next/server"
import {
  rejectPartnershipApplication,
  type PartnershipApplicationItem,
} from "@/features/partner/api"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAdmin,
} from "@/lib/api/route-helpers"
import { rejectPartnershipSchema } from "@/schemas/partnership"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  const parsed = await readJsonBody(request, rejectPartnershipSchema)
  if (!parsed.ok) return parsed.response

  try {
    const data = await rejectPartnershipApplication(id, parsed.data.reason)
    return jsonSuccess<PartnershipApplicationItem>(data)
  } catch (err) {
    console.error("[api/partnership-applications/[id]/reject] POST failed", err)
    return handleUpstreamError(err, "Failed to reject application")
  }
}

