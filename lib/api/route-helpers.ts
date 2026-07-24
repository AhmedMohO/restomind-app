import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, UserRole } from "@/features/auth/auth"
import { getErrorMessage } from "./utils"

/**
 * Checks if the current user session is authenticated and has the required role (default: "admin").
 * Returns a NextResponse error if unauthorized/forbidden, or null if authorized.
 */
export async function requireAuth(requiredRole?: UserRole): Promise<NextResponse<ApiResponse> | null> {
  const session = await getSession()

  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden", message: `${requiredRole} role required` },
      { status: 403 }
    )
  }

  return null
}

/**
 * Checks if the current user has one of the allowed roles.
 */
export async function requireAnyRole(
  roles: UserRole[]
): Promise<NextResponse<ApiResponse> | null> {
  const session = await getSession()

  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
    )
  }

  if (!roles.includes(session.user.role)) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Forbidden",
        message: `${roles.join(" or ")} role required`,
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Shortcut helper for admin-only routes.
 */
export async function requireAdmin(): Promise<NextResponse<ApiResponse> | null> {
  return requireAuth("admin")
}

/**
 * Constructs a standardized JSON success response.
 */
export function jsonSuccess<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status })
}

/**
 * Constructs a standardized JSON error response.
 */
export function handleServerError(
  err: unknown,
  fallbackMessage: string,
  status: number = 500
): NextResponse<ApiResponse> {
  const message = getErrorMessage(err, fallbackMessage)
  const errorCode = status === 404 ? "NOT_FOUND" : status === 403 ? "Forbidden" : status === 401 ? "Unauthorized" : "INTERNAL_ERROR"

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: errorCode,
      message,
    },
    { status }
  )
}
