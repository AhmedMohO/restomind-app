import { connection } from "next/server"

import { getSales } from "@/features/sales/api"
import { parseSalesQuery } from "@/features/sales/api/query"
import { getCurrentUser } from "@/lib/auth/auth"
import {
  handleServerError,
  handleUpstreamError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const SALES_ROLES = ["admin", "manager"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole([...SALES_ROLES])
  if (authError) return authError

  const user = await getCurrentUser()
  if (!user) return handleServerError(null, "Not authenticated", 401)

  const { searchParams } = new URL(request.url)
  const parsed = parseSalesQuery(searchParams, user.role)
  if (!parsed.ok) return handleServerError(parsed.message, parsed.message, 400)

  try {
    const data = await getSales(parsed.params)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch sales transactions")
  }
}
