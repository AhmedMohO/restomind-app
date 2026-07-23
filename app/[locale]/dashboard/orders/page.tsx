import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { AdminOrdersTable } from "@/features/orders/components/admin-orders-table"

export const metadata: Metadata = {
  title: "Orders Management",
  description: "View, filter, and manage platform orders",
  robots: { index: false, follow: false },
}

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <AppSidebar>
      <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
        <AdminOrdersTable />
      </main>
    </AppSidebar>
  )
}
