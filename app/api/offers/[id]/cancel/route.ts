import { connection } from "next/server"

import { cancelOffer } from "@/features/offers/api"
import {
  handleServerError,
  jsonSuccess,
  requireAuth,
} from "@/lib/api/route-helpers"

const OFFER_WRITE_ROLE = "manager" as const

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAuth(OFFER_WRITE_ROLE)
  if (authError) return authError

  const { id } = await params

  try {
    const res = await cancelOffer(id)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to cancel offer")
  }
}
