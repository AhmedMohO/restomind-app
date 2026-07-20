"use client"

/**
 * Client-side auth state store (Zustand).
 *
 * This store caches the current user and role on the client for:
 * - Fast, synchronous role checks in UI components
 * - Conditional rendering (e.g. show admin buttons only for admin role)
 * - Dynamic navigation / sidebar filtering
 *
 * Important: This is NEVER the source of truth for security decisions.
 * All security decisions happen server-side in Server Components,
 * Server Actions, and Route Handlers using requireAuth() / requireRole().
 *
 * The store is hydrated by <AuthProvider> on mount via TanStack Query.
 */

import { create } from "zustand"
import type { SessionUser, UserRole } from "@/features/auth/auth"

interface AuthState {
  /** The currently authenticated user, or null if not logged in */
  user: SessionUser | null
  /** Whether the auth store has been hydrated from the server */
  isHydrated: boolean

  // --- Setters ---
  setUser: (user: SessionUser | null) => void
  setHydrated: (hydrated: boolean) => void

  // --- Role helpers ---
  /** Returns true if the user has the specified role */
  hasRole: (role: UserRole) => boolean
  /** Returns true if the user has any of the specified roles */
  hasAnyRole: (roles: UserRole[]) => boolean
  /** Returns true if the user is logged in */
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,

  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),

  hasRole: (role) => {
    const { user } = get()
    return user?.role === role
  },

  hasAnyRole: (roles) => {
    const { user } = get()
    if (!user) return false
    return roles.includes(user.role)
  },

  isLoggedIn: () => {
    return get().user !== null
  },
}))
