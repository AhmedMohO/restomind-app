import { connection } from "next/server"

import {
  createStockTransaction,
  getStockTransactions,
} from "@/features/inventory/api"
import type { StockTransactionTypeEnum } from "@/features/inventory/types"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const MANAGER_ROLES = ["manager", "admin"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const ingredientId = searchParams.get("ingredientId") ?? undefined
  const transactionType =
    (searchParams.get("transactionType") as StockTransactionTypeEnum) ?? undefined

  try {
    const data = await getStockTransactions({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(ingredientId ? { ingredientId } : {}),
      ...(transactionType ? { transactionType } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleServerError(err, "Failed to fetch stock transactions")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  try {
    const body = await request.json()
    const res = await createStockTransaction(body)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create stock transaction")
  }
}
