import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import type { Restaurant } from "@/features/restaurant/types"
import {
  deleteRestaurantApi,
  getRestaurantByIdApi,
  updateRestaurantApi,
} from "@/features/restaurant/api"
import { handleUpstreamError } from "@/lib/api/route-helpers"

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
    const restaurant = await getRestaurantByIdApi(id)
    return NextResponse.json<ApiResponse<Restaurant>>(
      { success: true, data: restaurant },
      { status: 200 }
    )
  } catch (err) {
    return handleUpstreamError(err, "Restaurant not found", 404)
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
  if (role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Admin role required" },
      { status: 403 }
    )
  }

  const { id } = await params

  try {
    const payload = await request.formData()

    const updated = await updateRestaurantApi(id, payload)
    return NextResponse.json<ApiResponse<Restaurant>>(
      { success: true, data: updated },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/restaurants/[id]] PATCH failed", err)
    return handleUpstreamError(err, "Failed to update restaurant")
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
    const res = await deleteRestaurantApi(id)
    return NextResponse.json<ApiResponse<{ message: string }>>(
      { success: true, message: res.message },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/restaurants/[id]] DELETE failed", err)
    return handleUpstreamError(err, "Failed to delete restaurant")
  }
}
