"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Wallet, Loader2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/useAuth"
import { AdminPayoutsPanel } from "./admin-payouts-panel"
import { PayoutHistory } from "./payout-history"
import { StatementView } from "./statement-view"
import { useMyPayoutHistory, useMyStatement } from "../hooks/use-payouts"

export function PayoutsContainer() {
  const t = useTranslations("Dashboard.payouts")
  const { role, isLoading: isAuthLoading } = useAuth()
  const isAdmin = role === "admin"

  const {
    data: statement,
    isLoading: isStatementLoading,
  } = useMyStatement(undefined, !isAdmin && !isAuthLoading)

  const { data: history = [] } = useMyPayoutHistory(!isAdmin && !isAuthLoading)

  if (isAuthLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
      ) : isStatementLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card p-12 text-muted-foreground shadow-sm">
          <Loader2 className="size-6 animate-spin" />
        </div>
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
    </div>
  )
}
