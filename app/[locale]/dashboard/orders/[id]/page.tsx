import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { AdminOrderDetails } from "@/features/orders/components/admin-order-details"

export const metadata: Metadata = {
  title: "Order Details",
  description: "View order group details and update order statuses",
  robots: { index: false, follow: false },
}

export default async function DashboardOrderDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <AdminOrderDetails orderGroupId={id} locale={locale} />
      </main>
    </AppSidebar>
  )
}
