"use client"

import { use } from "react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardOrderDetails } from "@/features/orders/components/dashboard-order-details"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { useLocale } from "next-intl"

function OrderDetailsContent({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const locale = useLocale()

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <DashboardOrderDetails groupOrderId={id} locale={locale} />
      </main>
    </AppSidebar>
  )
}

export default function DashboardOrderDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <OrderDetailsContent params={params} />
    </DashboardAuthGuard>
  )
}
