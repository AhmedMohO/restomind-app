"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchRefundsAction } from "../actions"
import type { ApiRefund } from "../api/type"

export const REFUNDS_QUERY_KEY = ["refunds"] as const

export function useRefunds() {
  return useQuery<ApiRefund[]>({
    queryKey: REFUNDS_QUERY_KEY,
    queryFn: async () => {
      return await fetchRefundsAction()
    },
    staleTime: 30 * 1000,
  })
}
