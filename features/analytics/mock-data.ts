import type {
  AnalyticsPeriod,
  DashboardStatsResponse,
  ManagerDashboardStatsResponse,
} from "./types"

export function getAdminMockStats(period: AnalyticsPeriod): DashboardStatsResponse {
  const revCurrent = period === "7d" ? 3850 : 16420
  const ordersCurrent = period === "7d" ? 58 : 246
  const deliveryCount = Math.round(ordersCurrent * 0.72)
  const pickupCount = ordersCurrent - deliveryCount

  return {
    kpis: {
      revenue: {
        current: revCurrent,
        previous: period === "7d" ? 3420 : 14800,
        changePercent: period === "7d" ? 12.57 : 10.95,
      },
      orders: {
        current: ordersCurrent,
        previous: period === "7d" ? 52 : 225,
        changePercent: period === "7d" ? 11.53 : 9.33,
      },
      activeOffers: 42,
      pendingOrders: 5,
      activeRestaurants: 14,
      netProfit: Math.round(revCurrent * 0.86),
      taxDeduction: Math.round(revCurrent * 0.14),
      avgOrderValue: Math.round(revCurrent / (ordersCurrent || 1)),
      totalUsers: 79,
      totalRestaurants: 14,
    },
    topProducts: [
      { id: "p1", rank: 1, name: "كابتشينو", count: 24, maxCount: 24 },
      { id: "p2", rank: 2, name: "كيك كوري تخرج", count: 18, maxCount: 24 },
      { id: "p3", rank: 3, name: "كيك كوري", count: 15, maxCount: 24 },
      { id: "p4", rank: 4, name: "كيك مرتفع كريمه", count: 12, maxCount: 24 },
      { id: "p5", rank: 5, name: "دله قهوة سعودي صغير", count: 9, maxCount: 24 },
    ],
    topCategories: [
      { id: "c1", rank: 1, name: "المشروبات الساخنة", count: 45, maxCount: 45 },
      { id: "c2", rank: 2, name: "كيك كوري", count: 32, maxCount: 45 },
      { id: "c3", rank: 3, name: "كيك تخرج", count: 28, maxCount: 45 },
      { id: "c4", rank: 4, name: "كيك مناسبات كريمه", count: 20, maxCount: 45 },
      { id: "c5", rank: 5, name: "المشروبات الباردة", count: 16, maxCount: 45 },
    ],
    topRestaurants: [
      {
        id: "b1",
        rank: 1,
        name: "الفرع الرئيسي - المعادي",
        count: Math.round(ordersCurrent * 0.35),
        maxCount: Math.round(ordersCurrent * 0.35),
      },
      {
        id: "b2",
        rank: 2,
        name: "فرع مدينة نصر",
        count: Math.round(ordersCurrent * 0.25),
        maxCount: Math.round(ordersCurrent * 0.35),
      },
      {
        id: "b3",
        rank: 3,
        name: "فرع التجمع الخامس",
        count: Math.round(ordersCurrent * 0.2),
        maxCount: Math.round(ordersCurrent * 0.35),
      },
      {
        id: "b4",
        rank: 4,
        name: "فرع الشيخ زايد",
        count: Math.round(ordersCurrent * 0.12),
        maxCount: Math.round(ordersCurrent * 0.35),
      },
      {
        id: "b5",
        rank: 5,
        name: "فرع الإسكندرية",
        count: Math.round(ordersCurrent * 0.08),
        maxCount: Math.round(ordersCurrent * 0.35),
      },
    ],
    fulfillmentMethods: [
      {
        id: "delivery",
        type: "delivery",
        name: "Home Delivery",
        count: deliveryCount,
        percentage: 72,
      },
      {
        id: "pickup",
        type: "pickup",
        name: "Store Pickup",
        count: pickupCount,
        percentage: 28,
      },
    ],
  }
}

export function getManagerMockStats(
  period: AnalyticsPeriod,
  restaurantName = "Green Garden Bistro"
): ManagerDashboardStatsResponse {
  const revCurrent = period === "7d" ? 1450 : 6200
  const ordersCurrent = period === "7d" ? 22 : 94
  const deliveryCount = Math.round(ordersCurrent * 0.65)
  const pickupCount = ordersCurrent - deliveryCount

  return {
    restaurantName,
    kpis: {
      revenue: {
        current: revCurrent,
        previous: period === "7d" ? 1280 : 5600,
        changePercent: period === "7d" ? 13.28 : 10.71,
      },
      orders: {
        current: ordersCurrent,
        previous: period === "7d" ? 19 : 85,
        changePercent: period === "7d" ? 15.79 : 10.59,
      },
      activeOffers: 6,
      pendingOrders: 2,
      netProfit: Math.round(revCurrent * 0.86),
      taxDeduction: Math.round(revCurrent * 0.14),
      avgOrderValue: Math.round(revCurrent / (ordersCurrent || 1)),
      totalUsers: 24,
      totalRestaurants: 1,
    },
    topProducts: [
      { id: "mp1", rank: 1, name: "كابتشينو", count: 12, maxCount: 12 },
      { id: "mp2", rank: 2, name: "كيك كوري تخرج", count: 8, maxCount: 12 },
      { id: "mp3", rank: 3, name: "كيك كوري", count: 6, maxCount: 12 },
    ],
    topCategories: [
      { id: "mc1", rank: 1, name: "المشروبات الساخنة", count: 18, maxCount: 18 },
      { id: "mc2", rank: 2, name: "كيك كوري", count: 14, maxCount: 18 },
    ],
    topRestaurants: [
      {
        id: "mb1",
        rank: 1,
        name: restaurantName,
        count: ordersCurrent,
        maxCount: ordersCurrent,
      },
    ],
    fulfillmentMethods: [
      {
        id: "delivery",
        type: "delivery",
        name: "Home Delivery",
        count: deliveryCount,
        percentage: 65,
      },
      {
        id: "pickup",
        type: "pickup",
        name: "Store Pickup",
        count: pickupCount,
        percentage: 35,
      },
    ],
  }
}
