import { connection } from "next/server"

import { getOfferById, updateOffer } from "@/features/offers/api"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
  requireAuth,
} from "@/lib/api/route-helpers"
import { updateOfferSchema } from "@/schemas/offer"

const OFFER_ROLES = ["admin", "manager", "staff"] as const
const OFFER_WRITE_ROLES = ["admin", "manager", "staff"] as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole([...OFFER_ROLES])
  if (authError) return authError

  const { id } = await params

  try {
    const res = await getOfferById(id)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch offer")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole(OFFER_WRITE_ROLES)
  if (authError) return authError

  const { id } = await params

  const parsed = await readJsonBody(request, updateOfferSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await updateOffer(id, parsed.data)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to update offer")
  }
}
