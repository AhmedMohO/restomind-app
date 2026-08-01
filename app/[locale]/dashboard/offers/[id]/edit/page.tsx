"use client"

import { use } from "react"

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
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <OfferFormPage offerId={id} />
      </main>
    </DashboardAuthGuard>
  )
}
