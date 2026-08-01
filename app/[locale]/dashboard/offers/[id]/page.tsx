"use client"

import { use } from "react"

import { OfferDetailsContainer } from "@/features/offers/components/offer-details-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function OfferDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)

  return (
    <DashboardAuthGuard roles={["manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <OfferDetailsContainer offerId={id} />
      </main>
    </DashboardAuthGuard>
  )
}
