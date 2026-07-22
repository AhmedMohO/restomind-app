/**
 * TanStack Query hooks for user profile management in dashboard.
 * Provides data fetching and mutation handling with cache management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import { updateProfileAction } from "../actions/profile-actions"
import type { FullUser } from "../api/profile"
import { useAuthStore } from "@/features/auth/store/useAuthStore"

export const PROFILE_QUERY_KEY = ["user", "profile"] as const

/**
 * Hook to fetch the current logged-in user profile via TanStack Query.
 */
export function useProfile(initialData?: FullUser) {
  return useQuery<FullUser>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const data = await clientFetch<FullUser>("/profile")
      if (!data) throw new Error("Failed to load profile")
      return data
    },
    initialData,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to mutate/update the current user's profile via TanStack Query mutation.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await updateProfileAction(formData)
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to update profile")
      }
      return res.data
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<FullUser>(PROFILE_QUERY_KEY, updatedUser)
      setUser({
        ...updatedUser,
      })
    },
  })
}
