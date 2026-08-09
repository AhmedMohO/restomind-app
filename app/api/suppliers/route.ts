import { connection } from "next/server"

import { createSupplier, getSuppliers } from "@/features/suppliers/api"
import {
  handleUpstreamError,
  jsonSuccess,
  readJsonBody,
  requireAnyRole,
} from "@/lib/api/route-helpers"
import { createSupplierSchema } from "@/schemas/supplier"

const SUPPLIER_WRITE_ROLES = ["admin", "manager", "staff"] as const
const SUPPLIER_READ_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole([...SUPPLIER_READ_ROLES])
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const search = searchParams.get("search") ?? undefined

  try {
    const data = await getSuppliers({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(search ? { search } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleUpstreamError(err, "Failed to fetch suppliers")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole([...SUPPLIER_WRITE_ROLES])
  if (authError) return authError

  const parsed = await readJsonBody(request, createSupplierSchema)
  if (!parsed.ok) return parsed.response

  try {
    const data = await createSupplier(parsed.data)
    return jsonSuccess(data, 201)
  } catch (err) {
    return handleUpstreamError(err, "Failed to create supplier")
  }
}

