import type {
  AnalyticsPeriod,
  DashboardStatsResponse,
  ManagerDashboardStatsResponse,
} from "../types"
import { getAdminMockStats, getManagerMockStats } from "../mock-data"

/**
 * Fetches dashboard stats for Admin.
 * Currently returns structured mock data adhering to the proposed API contract (GET /admin/dashboard-stats).
 */
export async function getAdminDashboardStats(
  period: AnalyticsPeriod = "30d"
): Promise<DashboardStatsResponse> {
  // TODO: Replace with real API call when backend endpoint GET /admin/dashboard-stats is live:
  // const response = await apiClient(`/admin/dashboard-stats?period=${period}`)
  // return parseOrThrow<DashboardStatsResponse>(response, "getAdminDashboardStats")
  return getAdminMockStats(period)
}

/**
 * Fetches dashboard stats for Manager.
 * Currently returns structured mock data adhering to the proposed API contract (GET /manager/dashboard-stats).
 */
export async function getManagerDashboardStats(
  period: AnalyticsPeriod = "30d",
  restaurantName?: string
): Promise<ManagerDashboardStatsResponse> {
  // TODO: Replace with real API call when backend endpoint GET /manager/dashboard-stats is live:
  // const response = await apiClient(`/manager/dashboard-stats?period=${period}`)
  // return parseOrThrow<ManagerDashboardStatsResponse>(response, "getManagerDashboardStats")
  return getManagerMockStats(period, restaurantName)
}
