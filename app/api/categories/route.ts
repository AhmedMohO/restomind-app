import { connection } from "next/server"
import { createCategory, getCategories } from "@/features/categories/api"
import { handleServerError, jsonSuccess, requireAdmin } from "@/lib/api/route-helpers"

export async function GET(request: Request) {
  await connection()

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const search = searchParams.get("search") ?? undefined

  try {
    const data = await getCategories({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(search ? { search } : {}),
    })
    return jsonSuccess(data)
  } catch (err) {
    return handleServerError(err, "Failed to fetch categories")
  }
}

export async function POST(request: Request) {
  await connection()

  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const formData = await request.formData()
    const res = await createCategory(formData)
    return jsonSuccess(res.data, 201)
  } catch (err) {
    return handleServerError(err, "Failed to create category")
  }
}
