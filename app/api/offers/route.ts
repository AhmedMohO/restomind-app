import { connection } from "next/server"

import { createOffer, getOffers } from "@/features/offers/api"
import type { CreateOfferInput, GetOffersParams } from "@/features/offers/api/type"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
  requireAuth,
} from "@/lib/api/route-helpers"

const OFFER_ROLES = ["admin", "manager", "staff"] as const
const OFFER_WRITE_ROLE = "manager" as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole([...OFFER_ROLES])
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const status = searchParams.get("status") ?? undefined
  const source = searchParams.get("source") ?? undefined
  const categoryId = searchParams.get("categoryId") ?? undefined
  const search = searchParams.get("search") ?? undefined
  const sortBy = searchParams.get("sortBy") ?? undefined
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null

  try {
    const data = await getOffers({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(status ? { status: status as GetOffersParams["status"] } : {}),
      ...(source ? { source: source as GetOffersParams["source"] } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { search } : {}),
      ...(sortBy ? { sortBy: sortBy as GetOffersParams["sortBy"] } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleServerError(err, "Failed to fetch offers")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAuth(OFFER_WRITE_ROLE)
  if (authError) return authError

  try {
    const body = (await request.json()) as CreateOfferInput
    const res = await createOffer(body)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create offer")
  }
}
