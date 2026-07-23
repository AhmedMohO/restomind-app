import { useQuery } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import type {
  AnalyticsPeriod,
  DashboardStatsResponse,
  ManagerDashboardStatsResponse,
} from "../types"

export const ANALYTICS_QUERY_KEY = ["analytics"] as const

function calculateDateRange(period: AnalyticsPeriod): {
  startDate: string
  endDate: string
} {
  const end = new Date()
  const days = period === "7d" ? 7 : 30
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  }
}

/**
 * Custom TanStack Query hook for fetching Admin Analytics stats via BFF route handler.
 */
export function useAdminAnalytics(
  period: AnalyticsPeriod = "30d",
  enabled = true
) {
  return useQuery<DashboardStatsResponse>({
    queryKey: [...ANALYTICS_QUERY_KEY, "admin", period] as const,
    queryFn: async () => {
      const { startDate, endDate } = calculateDateRange(period)
      const qs = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      const data = await clientFetch<DashboardStatsResponse>(`/dashboard/admin${qs}`)
      if (!data) {
        throw new Error("No admin analytics data returned from API")
      }
      return data
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Custom TanStack Query hook for fetching Manager Analytics stats via BFF route handler.
 */
export function useManagerAnalytics(
  period: AnalyticsPeriod = "30d",
  enabled = true
) {
  return useQuery<ManagerDashboardStatsResponse>({
    queryKey: [...ANALYTICS_QUERY_KEY, "manager", period] as const,
    queryFn: async () => {
      const { startDate, endDate } = calculateDateRange(period)
      const qs = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      const data = await clientFetch<ManagerDashboardStatsResponse>(`/dashboard/manager${qs}`)
      if (!data) {
        throw new Error("No manager analytics data returned from API")
      }
      return data
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}
