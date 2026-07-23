import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  DashboardStatsResponse,
  ManagerDashboardStatsResponse,
} from "../types"

export * from "../types"

export interface GetDashboardStatsParams {
  startDate?: string
  endDate?: string
}

/**
 * GET /dashboard/admin — fetch admin analytics & KPIs (admin only).
 */
export async function getAdminDashboardStats(
  params: GetDashboardStatsParams = {}
): Promise<DashboardStatsResponse> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/dashboard/admin${qs}`)
  return parseOrThrow<DashboardStatsResponse>(
    response,
    "getAdminDashboardStats"
  )
}

/**
 * GET /dashboard/manager — fetch restaurant manager analytics & KPIs (manager only).
 */
export async function getManagerDashboardStats(
  params: GetDashboardStatsParams = {}
): Promise<ManagerDashboardStatsResponse> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/dashboard/manager${qs}`)
  return parseOrThrow<ManagerDashboardStatsResponse>(
    response,
    "getManagerDashboardStats"
  )
}
