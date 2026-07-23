import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { RestaurantContainer } from "@/features/restaurant/components/restaurant-container"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export const metadata: Metadata = {
  title: "Restaurants Management",
  description: "View and manage restaurants",
  robots: { index: false, follow: false },
}

export default async function RestaurantsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["admin", "manager"], locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <RestaurantContainer />
      </main>
    </AppSidebar>
  )
}
