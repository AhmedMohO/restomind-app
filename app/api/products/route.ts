import { connection } from "next/server"

import { createProduct, getProducts } from "@/features/products/api"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const PRODUCT_ROLES = ["admin", "manager", "staff"] as const

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const category = searchParams.get("category") ?? undefined
  const search = searchParams.get("search") ?? undefined
  const tag = searchParams.get("tag") ?? undefined
  const sort = searchParams.get("sort") ?? undefined
  const order = searchParams.get("order") as "asc" | "desc" | null
  const restaurantId = searchParams.get("restaurantId") ?? undefined

  try {
    const data = await getProducts({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
      ...(tag ? { tag } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
      ...(restaurantId ? { restaurantId } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleServerError(err, "Failed to fetch products")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  try {
    const formData = await request.formData()
    const res = await createProduct(formData)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create product")
  }
}
