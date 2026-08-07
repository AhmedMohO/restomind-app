"use client"

import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2, Clock, Landmark, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toEgp, type Payout, type PayoutStatus } from "../api/type"

const STATUS_CLASS: Record<PayoutStatus, string> = {
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

const STATUS_ICON = {
  pending: Clock,
  completed: CheckCircle2,
  failed: XCircle,
} as const

/**
 * Settlements that already happened.
 *
 * The statement only shows what is still owed, so without this a merchant has
 * no way to see money that already reached them — and no way to tell an empty
 * statement ("you were paid") from a broken one.
 *
 * `onComplete` is admin-only: a pending transfer has to be confirmed or failed
 * by hand, because only a landed transfer advances the paid-through mark.
 */
export function PayoutHistory({
  payouts,
  onComplete,
}: {
  payouts: Payout[]
  onComplete?: (payout: Payout) => void
}) {
  const t = useTranslations("Dashboard.payouts")
  const locale = useLocale()

  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
          <Landmark className="size-8" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          {t("history.emptyTitle")}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {t("history.emptyDescription")}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">
                {t("history.period")}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("history.amount")}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("history.status")}
              </TableHead>
              <TableHead className="text-xs font-semibold">
                {t("history.reference")}
              </TableHead>
              {onComplete && (
                <TableHead className="text-end text-xs font-semibold">
                  {t("history.actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => {
              const Icon = STATUS_ICON[payout.status]
              return (
                <TableRow key={payout._id}>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {formatDate(payout.periodStart, locale)} —{" "}
                    {formatDate(payout.periodEnd, locale)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold tabular-nums">
                        {formatCurrency(toEgp(payout.amountCents), locale)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {t(`history.direction.${payout.direction}` as never)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`gap-1.5 rounded-xl text-xs font-semibold ${STATUS_CLASS[payout.status]}`}
                    >
                      <Icon className="size-3.5" />
                      {t(`history.statuses.${payout.status}` as never)}
                    </Badge>
                    {payout.failureReason && (
                      <p className="mt-1 max-w-[220px] text-[11px] text-rose-600 dark:text-rose-400">
                        {payout.failureReason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {payout.reference || "—"}
                  </TableCell>
                  {onComplete && (
                    <TableCell className="text-end">
                      {payout.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl text-xs"
                          onClick={() => onComplete(payout)}
                        >
                          {t("history.confirm")}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
