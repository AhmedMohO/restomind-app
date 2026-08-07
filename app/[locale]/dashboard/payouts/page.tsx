import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Wallet } from "lucide-react"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { AdminPayoutsPanel } from "@/features/payouts/components/admin-payouts-panel"
import { PayoutHistory } from "@/features/payouts/components/payout-history"
import { StatementView } from "@/features/payouts/components/statement-view"
import { getMyPayoutHistory, getMyStatement } from "@/features/payouts/api"
import { getSession } from "@/lib/auth/session"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
  title: "Payouts | RestoMind",
  robots: { index: false, follow: false },
}

/**
 * Earnings after commission — the merchant's own money — and, for an admin,
 * the settlement desk for every merchant.
 *
 * The merchant half is server-rendered from `/payouts/statement`, which is
 * scoped to the caller's restaurant server-side. No restaurant id is ever
 * passed from the client, so one merchant cannot read another's balance.
 */
export default async function PayoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale
  setRequestLocale(safeLocale)

  const t = await getTranslations("Dashboard.payouts")
  const session = await getSession()
  const isAdmin = session.user?.role === "admin"

  // Admin has no restaurant of their own, so the merchant endpoints would 400.
  const [statement, history] = isAdmin
    ? [null, []]
    : await Promise.all([
        getMyStatement().catch(() => null),
        getMyPayoutHistory().catch(() => []),
      ])

  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
            <Wallet className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAdmin ? t("subtitleAdmin") : t("subtitle")}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <AdminPayoutsPanel />
        ) : statement ? (
          <>
            <StatementView statement={statement} />
            <div className="space-y-3">
              <h2 className="text-sm font-bold tracking-tight">
                {t("history.title")}
              </h2>
              <PayoutHistory payouts={history} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-700 dark:text-rose-300">
            {t("loadError")}
          </div>
        )}
      </main>
    </DashboardAuthGuard>
  )
}
