import { connection } from "next/server"

import { cancelOffer } from "@/features/offers/api"
import {
  handleUpstreamError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const OFFER_WRITE_ROLES = ["admin", "manager", "staff"] as const

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole(OFFER_WRITE_ROLES)
  if (authError) return authError

  const { id } = await params

  try {
    const res = await cancelOffer(id)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to cancel offer")
  }
}
