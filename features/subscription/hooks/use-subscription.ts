import { useQuery } from "@tanstack/react-query"
import { fetchMySubscriptionAction } from "../actions"
import type { MySubscription } from "../api/type"

export const SUBSCRIPTION_QUERY_KEY = ["subscription", "me"] as const

/**
 * TanStack Query hook to fetch current user's restaurant subscription details via Server Action.
 */
export function useMySubscription() {
  return useQuery<MySubscription | null>({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async () => {
      return await fetchMySubscriptionAction()
    },
    staleTime: 60 * 1000,
  })
}
