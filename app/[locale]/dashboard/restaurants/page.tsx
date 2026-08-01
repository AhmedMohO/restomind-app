"use client"

import { RestaurantContainer } from "@/features/restaurant/components/restaurant-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function RestaurantsPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <RestaurantContainer />
      </main>
    </DashboardAuthGuard>
  )
}
