import { connection } from "next/server"

import {
  createPurchaseOrder,
  getPurchaseOrders,
} from "@/features/purchase-orders/api"
import type { PurchaseOrderStatus } from "@/features/purchase-orders/types"
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
  const status = (searchParams.get("status") as PurchaseOrderStatus) ?? undefined
  const supplierId = searchParams.get("supplierId") ?? undefined

  try {
    const data = await getPurchaseOrders({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(status ? { status } : {}),
      ...(supplierId ? { supplierId } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleServerError(err, "Failed to fetch purchase orders")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(MANAGER_ROLES)
  if (authError) return authError

  try {
    const body = await request.json()
    const res = await createPurchaseOrder(body)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create purchase order")
  }
}
