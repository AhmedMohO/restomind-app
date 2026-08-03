import { connection } from "next/server"

import { createSupplier, getSuppliers } from "@/features/suppliers/api"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const MANAGER_ROLES = ["manager", "admin"] as const
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
    return handleServerError(err, "Failed to fetch suppliers")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole([...MANAGER_ROLES])
  if (authError) return authError

  try {
    const body = await request.json()
    const data = await createSupplier(body)
    return jsonSuccess(data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create supplier")
  }
}

