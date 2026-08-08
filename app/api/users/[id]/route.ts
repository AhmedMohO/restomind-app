import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import {
  deleteUser,
  getUserById,
  updateUser,
  type ApiUser,
  type UpdateUserPayload,
} from "@/features/users/api"
import { ApiError } from "@/lib/auth/errors"
import {
  handleServerError,
  readJsonBody,
  requireAnyRole,
  requireSessionUser,
} from "@/lib/api/route-helpers"
import { updateUserSchema } from "@/schemas/user"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const authError = await requireAnyRole(["admin", "manager"])
  if (authError) return authError

  const { id } = await params

  try {
    const res = await getUserById(id)
    const userData = (res as Record<string, unknown>)?.data ?? res
    return NextResponse.json<ApiResponse<ApiUser>>(
      { success: true, data: userData as ApiUser },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/users/[id]] GET failed", err)
    const status = err instanceof ApiError ? err.statusCode : 404
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "NOT_FOUND",
        message: err instanceof Error ? err.message : "User not found",
      },
      { status }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const auth = await requireSessionUser(["admin", "manager"])
  if (!auth.ok) return auth.response

  const parsed = await readJsonBody(request, updateUserSchema)
  if (!parsed.ok) return parsed.response

  const body = parsed.data

  if (auth.user.role !== "admin") {
    if (body.role === "admin" || body.role === "manager") {
      return handleServerError(
        "Only an admin can assign the admin or manager role",
        "Only an admin can assign the admin or manager role",
        403
      )
    }
    body.restaurantId = auth.user.restaurantId ?? null
  }

  const { id } = await params

  // updateUserSchema allows `null` on several optional fields (for clearing
  // values on update-style forms); UpdateUserPayload only accepts
  // `string | undefined` for those same fields. Normalize null -> undefined
  // here rather than relaxing the schema or casting past the mismatch.
  const payload: UpdateUserPayload = {
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    role: body.role,
    restaurantId: body.restaurantId ?? undefined,
    gender: body.gender ?? undefined,
    DOB: body.DOB ?? undefined,
    employeeCode: body.employeeCode ?? undefined,
    department: body.department ?? undefined,
    hireDate: body.hireDate ?? undefined,
    notes: body.notes ?? undefined,
    isActive: body.isActive,
    employmentStatus: body.employmentStatus,
  }

  try {
    const res = await updateUser(id, payload)
    const userData = (res as Record<string, unknown>)?.data ?? res
    return NextResponse.json<ApiResponse<ApiUser>>(
      { success: true, data: userData as ApiUser },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/users/[id]] PATCH failed", err)
    const status = err instanceof ApiError ? err.statusCode : 500
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "UPDATE_FAILED",
        message: err instanceof Error ? err.message : "Failed to update user",
      },
      { status }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  const role = session.user.role as UserRole
  if (role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Admin role required" },
      { status: 403 }
    )
  }

  const { id } = await params

  try {
    const res = await deleteUser(id)
    return NextResponse.json<ApiResponse<{ message: string }>>(
      { success: true, message: res.message || "User deleted successfully" },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/users/[id]] DELETE failed", err)
    const status = err instanceof ApiError ? err.statusCode : 500
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "DELETE_FAILED",
        message: err instanceof Error ? err.message : "Failed to delete user",
      },
      { status }
    )
  }
}
