import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardOrdersTable } from "@/features/orders/components/dashboard-orders-table"
import { ORDER_DASHBOARD_ROLES } from "@/features/orders/api/dashboard"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export const metadata: Metadata = {
  title: "Orders Management",
  description: "View, filter, and manage orders",
  robots: { index: false, follow: false },
}

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireRoleOrRedirect([...ORDER_DASHBOARD_ROLES], locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <DashboardOrdersTable role={user.role} />
      </main>
    </AppSidebar>
  )
}
