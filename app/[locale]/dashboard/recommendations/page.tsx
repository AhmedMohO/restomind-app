import { getTranslations, setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { RecommendationList } from "@/features/recommendations/components/recommendation-list"
import { ScanSurplusPanel } from "@/features/recommendations/components/scan-surplus-panel"

/**
 * Recommendations inbox — AI-suggested surplus discounts for a manager's own
 * restaurant. A server component: the interactive scan button/degraded
 * banner and the list itself are client components composed in below it.
 */
export default async function DashboardRecommendationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("recommendations")

  return (
    <DashboardAuthGuard roles={["manager"]}>
      <AppSidebar>
        <main className="w-full min-w-0 flex-1 space-y-6 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-lg font-semibold">{t("title")}</h1>
            <ScanSurplusPanel />
          </div>
          <RecommendationList />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
