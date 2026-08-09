import { connection } from "next/server"

import {
  createPurchaseOrder,
  getPurchaseOrders,
} from "@/features/purchase-orders/api"
import type { PurchaseOrderStatus } from "@/features/purchase-orders/types"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { createPurchaseOrderSchema } from "@/schemas/purchase-order"

const PO_WRITE_ROLES = ["admin", "manager", "staff"] as const
const PO_READ_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(PO_READ_ROLES)
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
    return handleUpstreamError(err, "Failed to fetch purchase orders")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole(PO_WRITE_ROLES)
  if (authError) return authError

  const parsed = await readJsonBody(request, createPurchaseOrderSchema)
  if (!parsed.ok) return parsed.response

  try {
    const res = await createPurchaseOrder(parsed.data)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleUpstreamError(err, "Failed to create purchase order")
  }
}
