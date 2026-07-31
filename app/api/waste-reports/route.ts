import { connection } from "next/server"

import { getWasteReports } from "@/features/waste/api"
import type { GetWasteReportsParams } from "@/features/waste/api/type"
import {
  handleServerError,
  handleUpstreamError,
  jsonSuccess,
  requireSessionUser,
} from "@/lib/api/route-helpers"

const RISK_LEVELS = ["low", "medium", "high"] as const
type RiskLevelParam = (typeof RISK_LEVELS)[number]

type ParseResult =
  { ok: true; params: GetWasteReportsParams } | { ok: false; message: string }

/**
 * Validates at the BFF boundary so a malformed filter gets a 400 with
 * detail rather than an opaque upstream error. No dedicated `query.ts`
 * module here (unlike predictions/recommendations) — the waste-reports
 * query surface is just these four params, so it's inlined the same way
 * `app/api/predictions/accuracy/route.ts` inlines its single `?weeks=`
 * clamp.
 */
function parseWasteReportsQuery(sp: URLSearchParams): ParseResult {
  const params: GetWasteReportsParams = {}

  const page = sp.get("page")
  if (page !== null) {
    const n = Number(page)
    if (!Number.isInteger(n) || n < 1)
      return { ok: false, message: "page must be a positive integer" }
    params.page = n
  }

  const limit = sp.get("limit")
  if (limit !== null) {
    const n = Number(limit)
    if (!Number.isInteger(n) || n < 1 || n > 100)
      return {
        ok: false,
        message: "limit must be an integer between 1 and 100",
      }
    params.limit = n
  }

  const riskLevel = sp.get("riskLevel")
  if (riskLevel !== null) {
    if (!RISK_LEVELS.includes(riskLevel as RiskLevelParam))
      return {
        ok: false,
        message: `riskLevel must be one of ${RISK_LEVELS.join(", ")}`,
      }
    params.riskLevel = riskLevel as RiskLevelParam
  }

  const ingredientId = sp.get("ingredientId")
  if (ingredientId !== null) {
    if (!/^[a-f\d]{24}$/i.test(ingredientId))
      return { ok: false, message: "ingredientId must be a valid id" }
    params.ingredientId = ingredientId
  }

  return { ok: true, params }
}

export async function GET(request: Request) {
  await connection()

  const auth = await requireSessionUser(["manager"])
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const parsed = parseWasteReportsQuery(searchParams)
  if (!parsed.ok) return handleServerError(parsed.message, parsed.message, 400)

  try {
    const data = await getWasteReports(parsed.params)
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch waste reports")
  }
}
