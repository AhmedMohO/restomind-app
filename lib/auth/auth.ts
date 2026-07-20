/**
 * Server-side authorization helpers — server-only.
 *
 * Provides reusable guards for Server Components, Server Actions,
 * and Route Handlers. All authorization logic is centralised here.
 *
 * Usage in a Server Component:
 *   const user = await requireRole(["admin", "manager"])
 *   // user is guaranteed to be a SessionUser at this point
 *
 * Usage in a Server Action:
 *   const user = await requireAuth()
 */

import "server-only"

import { getSession } from "./session"
import { AuthenticationError, AuthorizationError } from "./errors"
import type { SessionUser, UserRole } from "@/features/auth/auth"

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user from the session, or null if unauthenticated.
 * Never throws — use `requireAuth()` when you want to enforce authentication.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return null
  }
  return session.user
}

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

/**
 * Asserts that the request is authenticated.
 * Returns the session user if authenticated.
 *
 * @throws {AuthenticationError} when the user is not logged in
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    console.warn("[auth] Unauthenticated access attempt")
    throw new AuthenticationError("You must be logged in to access this page")
  }
  return user
}

// ---------------------------------------------------------------------------
// hasRole (non-throwing)
// ---------------------------------------------------------------------------

/**
 * Non-throwing role check for Server Components that need to *branch* on
 * roles rather than *enforce* them (e.g. rendering an admin-only nav link
 * inside an otherwise public RSC tree).
 *
 * Returns `{ user, ok }` instead of throwing. Use `requireRole()` when you
 * want to hard-block access; use `hasRole()` when you want to optionally
 * render something for a privileged user.
 *
 * @example
 * const { user, ok } = await hasRole(["admin", "manager"])
 * {ok && <AdminLink/>}
 */
export async function hasRole(
  roles: UserRole[]
): Promise<{ user: SessionUser | null; ok: boolean }> {
  const user = await getCurrentUser()
  return {
    user,
    ok: user !== null && roles.includes(user.role),
  }
}

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------

/**
 * Asserts that the authenticated user has one of the allowed roles.
 * Returns the session user if authorised.
 *
 * @param roles - Array of roles permitted to proceed
 * @throws {AuthenticationError} when the user is not logged in
 * @throws {AuthorizationError} when the user's role is not in the allowed list
 *
 * @example
 * // In a Server Component:
 * const user = await requireRole(["admin", "manager"])
 */
export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth()

  if (!roles.includes(user.role)) {
    console.warn("[auth] Unauthorized access attempt", {
      userRole: user.role,
      requiredRoles: roles,
      userId: user._id,
    })
    throw new AuthorizationError(
      `This page requires one of the following roles: ${roles.join(", ")}`
    )
  }

  return user
}
