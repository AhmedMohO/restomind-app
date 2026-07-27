import { connection } from "next/server"

import { getOfferById, updateOffer } from "@/features/offers/api"
import type { UpdateOfferInput } from "@/features/offers/api/type"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const OFFER_ROLES = ["manager"] as const

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
    return handleServerError(err, "Failed to fetch offer")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole([...OFFER_ROLES])
  if (authError) return authError

  const { id } = await params

  try {
    const body = (await request.json()) as UpdateOfferInput
    const res = await updateOffer(id, body)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update offer")
  }
}
