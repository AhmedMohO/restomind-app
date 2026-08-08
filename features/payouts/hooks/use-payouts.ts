"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchMyPayoutHistoryAction,
  fetchMyStatementAction,
} from "../actions"
import type { Payout, PayoutStatement } from "../api/type"

export const PAYOUTS_QUERY_KEY = ["payouts"] as const

export function useMyStatement(cutoffDate?: string, enabled = true) {
  return useQuery<PayoutStatement | null>({
    queryKey: [...PAYOUTS_QUERY_KEY, "statement", cutoffDate],
    queryFn: () => fetchMyStatementAction(cutoffDate),
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useMyPayoutHistory(enabled = true) {
  return useQuery<Payout[]>({
    queryKey: [...PAYOUTS_QUERY_KEY, "history"],
    queryFn: () => fetchMyPayoutHistoryAction(),
    enabled,
    staleTime: 60 * 1000,
  })
}
