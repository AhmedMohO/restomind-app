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

export async function GET(
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

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  const role = session.user.role as UserRole
  if (role !== "admin" && role !== "manager") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Admin or manager role required" },
      { status: 403 }
    )
  }

  const { id } = await params

  let body: UpdateUserPayload
  try {
    body = (await request.json()) as UpdateUserPayload
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  try {
    const res = await updateUser(id, body)
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
