"use client"

import { useTranslations } from "next-intl"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { BackButton } from "@/components/ui/back-button"
import { CreateBatchPage } from "@/features/inventory/components/create-batch-page"

export default function NewInventoryBatchesPage() {
  const t = useTranslations("Dashboard.inventory")

  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <BackButton
                  href="/dashboard/inventory"
                  aria-label={t("backToInventory")}
                />
                <h1 className="font-heading text-2xl font-bold tracking-tight">
                  {t("createBatchPageTitle")}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("createBatchPageSubtitle")}
              </p>
            </div>
          </div>

          <CreateBatchPage />
        </div>
      </main>
    </DashboardAuthGuard>
  )
}
