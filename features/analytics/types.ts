/**
 * Types for Analytics / Overview Dashboard.
 * Defines the contract for dashboard statistics, KPIs, top-performing metrics,
 * and overview responses for both Admin and Manager roles.
 */

export type AnalyticsPeriod = "7d" | "30d"

export interface KpiMetric {
  current: number
  previous: number
  changePercent: number
}

export interface RankedItem {
  id: string
  rank: number
  name: string
  count: number
  maxCount?: number
}

export interface RestaurantPerformance {
  id: string
  rank: number
  name: string
  count: number
  maxCount?: number
}

export interface FulfillmentMethodItem {
  id: string
  type: "delivery" | "pickup"
  name: string
  count: number
  percentage: number
}

/** Admin KPI Summary Cards */
export interface AdminKpiSummary {
  revenue: KpiMetric
  orders: KpiMetric
  activeOffers: number
  pendingOrders: number
  activeRestaurants: number
  netProfit?: number
  taxDeduction?: number
  avgOrderValue?: number
  totalUsers?: number
  totalRestaurants?: number
}

/** Manager KPI Summary Cards (no activeRestaurants) */
export interface ManagerKpiSummary {
  revenue: KpiMetric
  orders: KpiMetric
  activeOffers: number
  pendingOrders: number
  netProfit?: number
  taxDeduction?: number
  avgOrderValue?: number
  totalUsers?: number
  totalRestaurants?: number
}

/** Admin Dashboard Response Schema */
export interface DashboardStatsResponse {
  /** KPI summary cards */
  kpis: AdminKpiSummary

  /** Top selling products ranked list */
  topProducts?: RankedItem[]

  /** Top selling categories ranked list */
  topCategories?: RankedItem[]

  /** Top performing restaurants list */
  topRestaurants?: RestaurantPerformance[]

  /** Order fulfillment method breakdown (Home Delivery vs Store Pickup) */
  fulfillmentMethods?: FulfillmentMethodItem[]
}

/** Manager Dashboard Response Schema */
export interface ManagerDashboardStatsResponse {
  /** Restaurant name assigned to manager */
  restaurantName: string

  /** KPI summary cards (without activeRestaurants) */
  kpis: ManagerKpiSummary

  /** Top selling products for this restaurant */
  topProducts?: RankedItem[]

  /** Top selling categories for this restaurant */
  topCategories?: RankedItem[]

  /** Top performing restaurants list */
  topRestaurants?: RestaurantPerformance[]

  /** Order fulfillment method breakdown (Home Delivery vs Store Pickup) */
  fulfillmentMethods?: FulfillmentMethodItem[]
}
