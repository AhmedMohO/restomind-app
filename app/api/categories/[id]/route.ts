import { connection } from "next/server"
import { deleteCategory, getCategoryById, updateCategory } from "@/features/categories/api"
import { handleServerError, jsonSuccess, requireAdmin } from "@/lib/api/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const { id } = await params

  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const res = await getCategoryById(id)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Category not found", 404)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const { id } = await params

  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const formData = await request.formData()
    const res = await updateCategory(id, formData)
    return jsonSuccess(res.data)
  } catch (err) {
    return handleServerError(err, "Failed to update category")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()
  const { id } = await params

  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const res = await deleteCategory(id)
    return jsonSuccess({ message: res.message })
  } catch (err) {
    return handleServerError(err, "Failed to delete category")
  }
}
