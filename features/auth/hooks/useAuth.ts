"use client"

/**
 * useAuth — ergonomic read-only selector over the Zustand auth store.
 *
 * This hook is the single entry point for client components that need to
 * read auth state. It surfaces the store's role helpers (`hasRole`,
 * `hasAnyRole`, `isLoggedIn`) so components stop re-deriving role checks
 * from `user?.role` inline.
 *
 * Mutations (`setUser`, `setHydrated`) are intentionally NOT exposed here.
 * Components that need to mutate the store (login/logout flows) should call
 * `useAuthStore.getState()` or `useAuthStore((s) => s.setUser)` directly.
 * This keeps `useAuth` purely presentational and prevents accidental
 * writes from render paths.
 *
 * Security note: this hook is for UI show/hide only. The source of truth
 * for authorization is server-side (`requireAuth` / `requireRole` in
 * `lib/auth/auth.ts`).
 */

import { useAuthStore } from "@/features/auth/store/useAuthStore"
import type { UserRole } from "@/features/auth/auth"

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const hasRole = useAuthStore((s) => s.hasRole)
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  return {
    /** The currently authenticated user, or null if logged out / not hydrated */
    user,
    /** True once the AuthProvider has finished its initial /api/auth/me check */
    isHydrated,
    /** True only when hydrated AND a user is present */
    isAuthenticated: isHydrated && user !== null,
    /** True only while hydration is in progress (use for loading skeletons) */
    isLoading: !isHydrated,
    /** The user's role, or null when logged out */
    role: (user?.role ?? null) as UserRole | null,
    /** Returns true if the user has the specified role */
    hasRole,
    /** Returns true if the user has any of the specified roles */
    hasAnyRole,
    /** Returns true if the user is logged in (does not wait for hydration) */
    isLoggedIn,
  }
}
