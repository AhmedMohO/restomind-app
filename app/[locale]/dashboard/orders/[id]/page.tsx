import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardOrderDetails } from "@/features/orders/components/dashboard-order-details"
import { ORDER_DASHBOARD_ROLES } from "@/features/orders/api/dashboard"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export const metadata: Metadata = {
  title: "Order Details",
  description: "View order details and update order statuses",
  robots: { index: false, follow: false },
}

export default async function DashboardOrderDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect([...ORDER_DASHBOARD_ROLES], locale)

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <DashboardOrderDetails groupOrderId={id} locale={locale} />
      </main>
    </AppSidebar>
  )
}
