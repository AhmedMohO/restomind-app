"use client"

import { use } from "react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { OfferFormPage } from "@/features/offers/components/offer-form-page"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function EditOfferPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["manager", "staff"]}>
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <OfferFormPage offerId={id} />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
