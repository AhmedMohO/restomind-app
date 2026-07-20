"use client"

/**
 * AuthProvider — Client-side session hydration.
 *
 * On mount, fetches the current user via the BFF /api/auth/me endpoint and
 * hydrates the Zustand auth store. This keeps all page routes static —
 * auth state is never read in the RSC tree.
 *
 * When unauthenticated, /api/auth/me returns 401 silently (no console error)
 * and `fetchCurrentUser` resolves to null, leaving the store in its
 * logged-out state. TanStack Query is configured with retry:false so there
 * is exactly one request per mount.
 */

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import type { SessionUser } from "@/features/auth/auth"

async function fetchCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  })

  // 401/403 = not authenticated — silent, expected, not an error
  if (response.status === 401 || response.status === 403) {
    return null
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user profile")
  }

  const json = (await response.json()) as { data?: { user?: SessionUser } }
  return json.data?.user ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setHydrated = useAuthStore((s) => s.setHydrated)

  const { data: user, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Hydrate the store whenever the resolved user changes.
  useEffect(() => {
    if (user !== undefined) {
      setUser(user)
      setHydrated(true)
    }
  }, [user, setUser, setHydrated])

  // On hard fetch failure (network error etc.) — treat as logged out.
  useEffect(() => {
    if (isError) {
      setUser(null)
      setHydrated(true)
    }
  }, [isError, setUser, setHydrated])

  return <>{children}</>
}
