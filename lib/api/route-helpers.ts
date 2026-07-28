import { NextResponse } from "next/server"
import type { ZodType } from "zod"
import { getSession } from "@/lib/auth/session"
import type { ApiResponse, SessionUser, UserRole } from "@/features/auth/auth"
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
  roles: readonly UserRole[]
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
 * Authenticates the caller and checks their role, returning the session user
 * itself so the handler can scope data to them (e.g. a manager's restaurant).
 *
 *   const auth = await requireSessionUser(["admin", "manager"])
 *   if (!auth.ok) return auth.response
 *   // auth.user is a fully typed SessionUser here
 */
export async function requireSessionUser(
  roles: readonly UserRole[]
): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: NextResponse<ApiResponse> }
> {
  const session = await getSession()

  if (!session.isLoggedIn || !session.user) {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized", message: "Not authenticated" },
        { status: 401 }
      ),
    }
  }

  if (roles.length > 0 && !roles.includes(session.user.role)) {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Forbidden",
          message: `${roles.join(" or ")} role required`,
        },
        { status: 403 }
      ),
    }
  }

  return { ok: true, user: session.user }
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

/**
 * Parses and validates a JSON request body against a Zod schema.
 *
 * Returns a discriminated result so the caller stays flat:
 *
 *   const parsed = await readJsonBody(request, schema)
 *   if (!parsed.ok) return parsed.response
 *   // parsed.data is fully typed here
 *
 * Validating at the BFF boundary keeps malformed payloads from reaching the
 * upstream API and gives the client a 400 with field-level detail instead of
 * an opaque upstream error.
 */
export async function readJsonBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<
  { ok: true; data: T } | { ok: false; response: NextResponse<ApiResponse> }
> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse>(
        { success: false, error: "BAD_REQUEST", message: "Invalid JSON body" },
        { status: 400 }
      ),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const message = result.error.issues
      .map((issue) =>
        issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message
      )
      .join(", ")

    return {
      ok: false,
      response: NextResponse.json<ApiResponse>(
        { success: false, error: "VALIDATION_ERROR", message },
        { status: 400 }
      ),
    }
  }

  return { ok: true, data: result.data }
}

/**
 * Reads the HTTP status carried by an upstream error (`ApiError`,
 * `AuthenticationError`, …). Falls back to `fallbackStatus` for plain errors
 * (network failures, JSON parse errors) which carry no status of their own.
 */
export function getErrorStatus(err: unknown, fallbackStatus = 500): number {
  const status = (err as { statusCode?: unknown })?.statusCode
  return typeof status === "number" && status >= 400 && status <= 599
    ? status
    : fallbackStatus
}

/**
 * Error response that preserves the upstream status code.
 *
 * Prefer this over `handleServerError` with a hardcoded status whenever the
 * backend distinguishes meaningful failures the UI must react to — e.g. 409
 * (duplicate ingredient code), 400 (ingredient still used by a recipe),
 * 404 (product has no recipe yet). Collapsing those into 500 would hide the
 * distinction from the client.
 */
export function handleUpstreamError(
  err: unknown,
  fallbackMessage: string,
  fallbackStatus = 500
): NextResponse<ApiResponse> {
  return handleServerError(err, fallbackMessage, getErrorStatus(err, fallbackStatus))
}
