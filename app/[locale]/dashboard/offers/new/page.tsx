"use client"

import { OfferFormPage } from "@/features/offers/components/offer-form-page"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function NewOfferPage() {
  return (
    <DashboardAuthGuard roles={["manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <OfferFormPage />
      </main>
    </DashboardAuthGuard>
  )
}
