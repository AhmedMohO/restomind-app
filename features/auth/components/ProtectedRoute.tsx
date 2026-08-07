/**
 * ProtectedRoute — reusable server component guard.
 *
 * Enforces authentication and optional role requirements at the layout
 * level. Handles redirects for unauthenticated (→ /login) and
 * unauthorized (→ /) users.
 *
 * Usage:
 *   // Auth-only (any logged-in user):
 *   <ProtectedRoute locale={locale}><Slot /></ProtectedRoute>
 *
 *   // With explicit roles:
 *   <ProtectedRoute locale={locale} roles={["admin"]}><Slot /></ProtectedRoute>
 *
 *   // Auto-resolve roles from ROUTE_ROLE_MAP:
 *   <ProtectedRoute locale={locale} route="/dashboard"><Slot /></ProtectedRoute>
 *
 * This is a Server Component — it may call cookies() / redirect().
 */

import { redirect } from "next/navigation"
import { requireAuth, requireRole } from "@/lib/auth/auth"
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors"
import { getRouteRoles } from "@/lib/auth/config"
import { routing } from "@/i18n/routing"
import type { UserRole } from "@/features/auth/auth"

interface Props {
  children: React.ReactNode
  /** Locale from the route parameter (passed explicitly from the layout) */
  locale: string
  /**
   * Override path prefix for role lookup in ROUTE_ROLE_MAP.
   * Omit if passing `roles` explicitly.
   */
  route?: string
  /**
   * Explicit list of allowed roles.
   * - undefined → resolve from ROUTE_ROLE_MAP via `route` prop
   * - empty array → auth-only (any logged-in user)
   * - populated array → require at least one of these roles
   */
  roles?: UserRole[]
}

export default async function ProtectedRoute({
  children,
  locale,
  route,
  roles: explicitRoles,
}: Props) {
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale

  let required: UserRole[] | null = null
  if (explicitRoles !== undefined) {
    required = explicitRoles.length > 0 ? explicitRoles : null
  } else if (route) {
    required = getRouteRoles(route)
  }

  let authError: "unauthenticated" | "unauthorized" | null = null

  try {
    if (!required || required.length === 0) {
      await requireAuth()
    } else {
      await requireRole(required)
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      authError = "unauthenticated"
    } else if (error instanceof AuthorizationError) {
      authError = "unauthorized"
    } else {
      throw error
    }
  }

  // redirect() throws NEXT_REDIRECT — must be called OUTSIDE the try block.
  if (authError === "unauthenticated") {
    const callbackParam = route
      ? `?callbackUrl=${encodeURIComponent(route)}`
      : ""
    redirect(`/${safeLocale}/login${callbackParam}`)
  }

  if (authError === "unauthorized") {
    redirect(`/${safeLocale}`)
  }

  return <>{children}</>
}
