import { connection } from "next/server"

import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/features/products/api"
import {
  handleServerError,
  jsonSuccess,
  requireAnyRole,
} from "@/lib/api/route-helpers"

const PRODUCT_ROLES = ["admin", "manager", "staff"] as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  const { id } = await params

  try {
    const res = await getProductById(id)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Product not found", 404)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  const { id } = await params

  try {
    const formData = await request.formData()
    const res = await updateProduct(id, formData)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update product")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const authError = await requireAnyRole([...PRODUCT_ROLES])
  if (authError) return authError

  const { id } = await params

  try {
    const res = await deleteProduct(id)
    return jsonSuccess({ message: res.message })
  } catch (err) {
    return handleServerError(err, "Failed to delete product")
  }
}
