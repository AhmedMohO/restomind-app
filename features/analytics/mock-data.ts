import type {
  AnalyticsPeriod,
  DashboardStatsResponse,
  ManagerDashboardStatsResponse,
  RevenueTrendPoint,
} from "./types"

function generateRevenueTrend(days: number): RevenueTrendPoint[] {
  const points: RevenueTrendPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)

    const dateStr = d.toISOString().split("T")[0]
    // Generate realistic fluctuating revenue between 250 and 850 EGP per day
    const baseRevenue = 300 + Math.floor(Math.sin(i) * 150) + (i % 3) * 120
    const ordersCount = Math.floor(baseRevenue / 65) + Math.floor(Math.random() * 3)

    points.push({
      date: dateStr,
      revenue: Math.max(120, baseRevenue),
      orders: Math.max(2, ordersCount),
    })
  }

  return points
}

export function getAdminMockStats(period: AnalyticsPeriod): DashboardStatsResponse {
  const days = period === "7d" ? 7 : 30

  return {
    period,
    kpis: {
      revenue: {
        current: period === "7d" ? 3850 : 16420,
        previous: period === "7d" ? 3420 : 14800,
        changePercent: period === "7d" ? 12.57 : 10.95,
      },
      orders: {
        current: period === "7d" ? 58 : 246,
        previous: period === "7d" ? 52 : 225,
        changePercent: period === "7d" ? 11.53 : 9.33,
      },
      activeOffers: 42,
      pendingOrders: 5,
      activeRestaurants: 14,
    },
    revenueTrend: generateRevenueTrend(days),
    ordersByStatus: {
      Pending: 5,
      Confirmed: 8,
      Preparing: 6,
      Ready: 4,
      "Out For Delivery": 7,
      Delivered: period === "7d" ? 58 : 246,
      Cancelled: 4,
    },
    recentOrders: [
      {
        orderGroupId: "669fc901a1b2c3d4e5f60001",
        customerName: "Ahmed Mohamed",
        restaurantNames: ["Green Garden Bistro"],
        finalTotalPrice: 185.0,
        overallStatus: "Pending",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        orderGroupId: "669fc901a1b2c3d4e5f60002",
        customerName: "Sara Hassan",
        restaurantNames: ["Pizza Gourmet"],
        finalTotalPrice: 240.5,
        overallStatus: "Preparing",
        createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      },
      {
        orderGroupId: "669fc901a1b2c3d4e5f60003",
        customerName: "Khaled Ali",
        restaurantNames: ["Burger & Co."],
        finalTotalPrice: 120.0,
        overallStatus: "Out For Delivery",
        createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
      },
      {
        orderGroupId: "669fc901a1b2c3d4e5f60004",
        customerName: "Mona Ibrahim",
        restaurantNames: ["Green Garden Bistro", "Gelato House"],
        finalTotalPrice: 310.0,
        overallStatus: "Delivered",
        createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      },
      {
        orderGroupId: "669fc901a1b2c3d4e5f60005",
        customerName: "Omar Tarek",
        restaurantNames: ["Taco Fiesta"],
        finalTotalPrice: 95.0,
        overallStatus: "Cancelled",
        createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
      },
    ],
    alerts: [
      {
        id: "alert-1",
        type: "stuck_pending",
        severity: "critical",
        messageKey: "alertStuckPending",
        count: 3,
        actionUrl: "/dashboard/orders?status=Pending",
      },
      {
        id: "alert-2",
        type: "no_active_offers",
        severity: "warning",
        messageKey: "alertNoActiveOffers",
        count: 2,
        actionUrl: "/dashboard/restaurants",
      },
      {
        id: "alert-3",
        type: "inactive_restaurants",
        severity: "info",
        messageKey: "alertInactiveRestaurants",
        count: 1,
        actionUrl: "/dashboard/restaurants",
      },
    ],
  }
}

export function getManagerMockStats(
  period: AnalyticsPeriod,
  restaurantName = "Green Garden Bistro"
): ManagerDashboardStatsResponse {
  const days = period === "7d" ? 7 : 30

  return {
    period,
    restaurantName,
    kpis: {
      revenue: {
        current: period === "7d" ? 1450 : 6200,
        previous: period === "7d" ? 1280 : 5600,
        changePercent: period === "7d" ? 13.28 : 10.71,
      },
      orders: {
        current: period === "7d" ? 22 : 94,
        previous: period === "7d" ? 19 : 85,
        changePercent: period === "7d" ? 15.79 : 10.59,
      },
      activeOffers: 6,
      pendingOrders: 2,
    },
    revenueTrend: generateRevenueTrend(days).map((pt) => ({
      ...pt,
      revenue: Math.round(pt.revenue * 0.4),
      orders: Math.max(1, Math.round(pt.orders * 0.4)),
    })),
    ordersByStatus: {
      Pending: 2,
      Confirmed: 3,
      Preparing: 2,
      Ready: 1,
      "Out For Delivery": 3,
      Delivered: period === "7d" ? 22 : 94,
      Cancelled: 1,
    },
    recentOrders: [
      {
        orderGroupId: "669fc901a1b2c3d4e5f60001",
        customerName: "Ahmed Mohamed",
        restaurantNames: [restaurantName],
        finalTotalPrice: 185.0,
        overallStatus: "Pending",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        orderGroupId: "669fc901a1b2c3d4e5f60004",
        customerName: "Mona Ibrahim",
        restaurantNames: [restaurantName],
        finalTotalPrice: 190.0,
        overallStatus: "Delivered",
        createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      },
    ],
    alerts: [
      {
        id: "alert-mgr-1",
        type: "stuck_pending",
        severity: "critical",
        messageKey: "alertStuckPendingManager",
        count: 2,
        actionUrl: "/dashboard/orders?status=Pending",
      },
    ],
  }
}
