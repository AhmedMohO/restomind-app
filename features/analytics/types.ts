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

export interface PlanRevenueItem {
  /** SubscriptionPlan slug, as snapshotted on the payment. */
  tier: string
  label: string
  amount: number
  count: number
}

/**
 * RestoMind's own money, in EGP.
 *
 * Separate from `revenue` above, which is GMV — the merchants' money passing
 * through the marketplace. The platform only ever earns commission and
 * subscriptions, and conflating the two is what made the old "net profit"
 * card (GMV minus 14%) meaningless.
 */
export interface PlatformKpis {
  /** Commission on delivered orders in the window, VAT-inclusive. */
  commission: KpiMetric
  /** The VAT portion — owed onward, not earned. */
  commissionVat: number
  commissionNet: number
  subscriptionRevenue: KpiMetric
  /** commission.current + subscriptionRevenue.current. */
  totalRevenue: number
  paidSubscriptions: number
  trialSubscriptions: number
  revenueByPlan: PlanRevenueItem[]
  refundedAmount: number
  refundsPending: number
  payoutsPending: number
  payoutsPendingCount: number
  payoutsCompleted: number
}

/** Admin KPI Summary Cards */
export interface AdminKpiSummary {
  /** Gross merchandise value — what customers paid the merchants. */
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
  platform?: PlatformKpis
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
  /** RestoMind's cut of this restaurant's delivered orders, in EGP. */
  commissionCharged?: number
  /** The rate those orders were sold under, as a fraction. */
  commissionRate?: number
  /** revenue.current − commissionCharged. An estimate, not a payable balance. */
  netAfterCommission?: number
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
