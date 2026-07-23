/**
 * Types for Analytics / Overview Dashboard.
 * Defines the contract for dashboard statistics, KPIs, alerts, revenue trends,
 * and order summaries for both Admin and Manager roles.
 */

export type AnalyticsPeriod = "7d" | "30d"

export interface KpiMetric {
  current: number
  previous: number
  changePercent: number
}

export interface AdminKpiSummary {
  revenue: KpiMetric
  orders: KpiMetric
  activeOffers: number
  pendingOrders: number
  activeRestaurants: number
}

export interface ManagerKpiSummary {
  revenue: KpiMetric
  orders: KpiMetric
  activeOffers: number
  pendingOrders: number
}

export interface RevenueTrendPoint {
  date: string // e.g. "2026-07-01" or formatted date label
  revenue: number
  orders: number
}

export interface OrdersByStatusSummary {
  Pending: number
  Confirmed: number
  Preparing: number
  Ready: number
  "Out For Delivery": number
  Delivered: number
  Cancelled: number
}

export interface DashboardRecentOrder {
  orderGroupId: string
  customerName: string
  restaurantNames: string[]
  finalTotalPrice: number
  overallStatus: string
  createdAt: string
}

export type AlertSeverity = "critical" | "warning" | "info"

export interface DashboardAlert {
  id: string
  type: "stuck_pending" | "high_cancellation" | "no_active_offers" | "inactive_restaurants"
  severity: AlertSeverity
  messageKey: string
  count?: number
  actionUrl?: string
}

export interface DashboardStatsResponse {
  period: AnalyticsPeriod
  kpis: AdminKpiSummary
  revenueTrend: RevenueTrendPoint[]
  ordersByStatus: OrdersByStatusSummary
  recentOrders: DashboardRecentOrder[]
  alerts: DashboardAlert[]
}

export interface ManagerDashboardStatsResponse {
  period: AnalyticsPeriod
  restaurantName: string
  kpis: ManagerKpiSummary
  revenueTrend: RevenueTrendPoint[]
  ordersByStatus: OrdersByStatusSummary
  recentOrders: DashboardRecentOrder[]
  alerts: DashboardAlert[]
}
