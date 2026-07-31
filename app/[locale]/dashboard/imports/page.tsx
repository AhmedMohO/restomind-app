import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { ImportWorkspace } from "@/features/imports/components/import-workspace"

/**
 * CSV import — a manager picks one of the five onboarding data types and
 * drops its file; upload and confirm run as a single automatic step with no
 * manual column-mapping or preview screen (see the task brief's "core UX
 * decision, already made"). A thin server shell: all interactive state
 * lives in the client `ImportWorkspace`.
 *
 * Unlike the manager-only AI screens (predictions, recommendations, waste),
 * `/imports` is authorized for both `manager` and `admin` on the backend
 * (`@Auth('manager', 'admin')` on every route in `imports.controller.ts`),
 * so the guard allows both roles here.
 */
export default async function DashboardImportsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <DashboardAuthGuard roles={["manager", "admin"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
          <ImportWorkspace />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
