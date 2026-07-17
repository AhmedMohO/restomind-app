"use client"

/**
 * Clerk-style declarative guard components for client-side rendering.
 *
 * These wrappers read state from `useAuth()` and render their children
 * (or a fallback) based on authentication status or role membership.
 * They are presentational only — they never redirect and never enforce
 * security. The source of truth for authorization is server-side, via
 * `requireAuth` / `requireRole` / `hasRole` in `lib/auth/auth.ts`.
 *
 * Usage:
 *   <SignedIn><UserMenu/></SignedIn>
 *   <SignedOut><LoginButton/><RegisterButton/></SignedOut>
 *   <HasRole roles={["admin","manager"]}><DashboardLink/></HasRole>
 *
 * Until the AuthProvider finishes hydrating, all guards render `null`
 * (or their `fallback`), matching the prior `isHydrated && user` pattern
 * and avoiding any flash of logged-out content.
 */

import * as React from "react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import type { UserRole } from "@/features/auth/auth"

// ---------------------------------------------------------------------------
// SignedIn / SignedOut
// ---------------------------------------------------------------------------

export function SignedIn({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isAuthenticated } = useAuth()
  return <>{isAuthenticated ? children : fallback}</>
}

export function SignedOut({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isAuthenticated } = useAuth()
  return <>{!isAuthenticated ? children : fallback}</>
}

// ---------------------------------------------------------------------------
// HasRole
// ---------------------------------------------------------------------------

export function HasRole({
  roles,
  children,
  fallback = null,
}: {
  roles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isAuthenticated, hasAnyRole } = useAuth()
  const ok = isAuthenticated && hasAnyRole(roles)
  return <>{ok ? children : fallback}</>
}
