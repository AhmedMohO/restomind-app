import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import RefundsTable from "@/features/refunds/components/RefundsTable"
import { getRefunds } from "@/features/refunds/api"
import { routing } from "@/i18n/routing"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export const metadata: Metadata = {
  title: "Refunds | RestoMind",
  robots: { index: false, follow: false },
}

export default async function RefundsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale
  setRequestLocale(safeLocale)

  const refunds = await getRefunds()
    .then((res) => res.data ?? [])
    .catch(() => [])

  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <RefundsTable refunds={refunds} />
      </main>
    </DashboardAuthGuard>
  )
}
