/**
 * /api/restaurant/me — BFF endpoints for the dashboard restaurant profile.
 *
 * GET   Role-aware: managers fetch their own restaurant via the backend's
 *       `/restaurants/me`; admins fetch the restaurant identified by
 *       `session.user.restaurantId`. Returns 404 JSON when no restaurant
 *       is linked to the current user.
 *
 * PATCH Reads the restaurant ID from the live session/GET result, then
 *       forwards the validated payload to `PATCH /restaurants/:id`.
 *
 * All responses follow the standard `ApiResponse` envelope so the client
 * fetch wrapper (`lib/api/fetch-client.ts`) can read `{ success, data, error }`
 * uniformly.
 */

import { NextResponse, connection } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import type {
  Restaurant,
  UpdateRestaurantPayload,
} from "@/features/restaurant/types"
import {
  getMyRestaurantApi,
  getRestaurantByIdApi,
  updateRestaurantApi,
} from "@/features/restaurant/api"

interface ResolvedRestaurant {
  restaurant: Restaurant | null
  status: number
  error?: string
}

/**
 * Resolves the current user's restaurant using their role + session.
 * Returns `null` (with status 404) when no restaurant is linked.
 */
async function resolveMyRestaurant(): Promise<ResolvedRestaurant> {
  const session = await getSession()

  if (!session.isLoggedIn || !session.user) {
    return { restaurant: null, status: 401, error: "Unauthorized" }
  }

  const role = session.user.role as UserRole
  const restaurantId = session.user.restaurantId

  try {
    if (role === "manager") {
      const restaurant = await getMyRestaurantApi()
      return { restaurant, status: 200 }
    }

    if (role === "admin") {
      if (!restaurantId) {
        return { restaurant: null, status: 404, error: "NOT_FOUND" }
      }
      const restaurant = await getRestaurantByIdApi(restaurantId)
      return { restaurant, status: 200 }
    }

    // Customers shouldn't reach /dashboard, but defend in depth.
    return { restaurant: null, status: 403, error: "Forbidden" }
  } catch (err) {
    const status =
      err instanceof Error && /404|NOT_FOUND/i.test(err.message) ? 404 : 500
    return {
      restaurant: null,
      status,
      error: status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
    }
  }
}

export async function GET() {
  await connection()

  const { restaurant, status, error } = await resolveMyRestaurant()

  if (!restaurant) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error ?? "Unknown", message: error ?? "Unknown" },
      { status }
    )
  }

  return NextResponse.json<ApiResponse<Restaurant>>(
    { success: true, data: restaurant },
    { status: 200 }
  )
}

export async function PATCH(request: Request) {
  await connection()

  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  let body: UpdateRestaurantPayload
  try {
    body = (await request.json()) as UpdateRestaurantPayload
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Bad Request", message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Bad Request",
        message: "Request body must not be empty",
      },
      { status: 400 }
    )
  }

  // Resolve the target restaurant ID from the session.
  const role = session.user.role as UserRole
  let restaurantId: string | undefined

  if (role === "manager") {
    // Manager path: fetch /restaurants/me to discover the ID, then PATCH it.
    try {
      const current = await getMyRestaurantApi()
      restaurantId = current._id
    } catch (err) {
      const status =
        err instanceof Error && /404|NOT_FOUND/i.test(err.message) ? 404 : 500
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
          message:
            status === 404
              ? "No restaurant linked to your account"
              : "Failed to resolve your restaurant",
        },
        { status }
      )
    }
  } else if (role === "admin") {
    restaurantId = session.user.restaurantId
  } else {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: "Forbidden" },
      { status: 403 }
    )
  }

  if (!restaurantId) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "NOT_FOUND",
        message: "No restaurant linked to your account",
      },
      { status: 404 }
    )
  }

  try {
    const updated = await updateRestaurantApi(restaurantId, body)
    return NextResponse.json<ApiResponse<Restaurant>>(
      { success: true, data: updated },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/restaurant/me] PATCH failed", err)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Failed to update restaurant profile",
      },
      { status: 500 }
    )
  }
}
