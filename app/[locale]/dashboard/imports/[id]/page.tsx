import { setRequestLocale } from "next-intl/server"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { ImportDetails } from "@/features/imports/components/import-details"

/**
 * Single Import Job Detail Page — displays full details, failure reason,
 * column mappings, row validation errors, and AI ingest retry options.
 */
export default async function DashboardImportDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return (
    <DashboardAuthGuard roles={["manager", "admin"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <ImportDetails importJobId={id} />
      </main>
    </DashboardAuthGuard>
  )
}
