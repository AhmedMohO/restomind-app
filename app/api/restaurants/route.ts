import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import type { PaginatedRestaurants, Restaurant } from "@/features/restaurant/types"
import { createRestaurantApi, getRestaurants } from "@/features/restaurant/api"
import { handleUpstreamError, requireAnyRole } from "@/lib/api/route-helpers"

export async function GET(request: Request) {
  await connection()

  const authError = await requireAnyRole(["admin", "manager"])
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const search = searchParams.get("search") ?? undefined

  try {
    const data = await getRestaurants({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(search ? { search } : {}),
    })
    return NextResponse.json<ApiResponse<PaginatedRestaurants>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/restaurants] GET failed", err)
    return handleUpstreamError(err, "Failed to fetch restaurants")
  }
}

export async function POST(request: Request) {
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

  try {
    const payload = await request.formData()

    const created = await createRestaurantApi(payload)
    return NextResponse.json<ApiResponse<Restaurant>>(
      { success: true, data: created },
      { status: 201 }
    )
  } catch (err) {
    console.error("[api/restaurants] POST failed", err)
    return handleUpstreamError(err, "Failed to create restaurant")
  }
}
