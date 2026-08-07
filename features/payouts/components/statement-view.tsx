"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Percent,
  PiggyBank,
  Receipt,
  Scale,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toEgp, type PayoutStatement } from "../api/type"

/**
 * The merchant-facing answer to "what do I actually get after the cut".
 *
 * Reads only the statement the API produced — it never re-derives a total from
 * the lines. The server sums stored integers; recomputing here would let the
 * page disagree with the money that is actually transferred.
 */
export function StatementView({
  statement,
}: {
  statement: PayoutStatement
}) {
  const t = useTranslations("Dashboard.payouts")
  const locale = useLocale()

  const { totals, decision } = statement
  const money = (cents: number) => formatCurrency(toEgp(cents), locale)

  // Effective rate over the period, shown because a merchant's contracted rate
  // and what a period actually cost them diverge as soon as refunds reverse
  // part of the commission.
  const effectiveRate =
    totals.grossCents > 0
      ? ((totals.commissionCents / totals.grossCents) * 100).toFixed(2)
      : null

  const owedToMerchant = totals.merchantNetCents >= 0

  return (
    <div className="space-y-6">
      {/* The three figures that answer the question, in order. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden border bg-card/60 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("totals.gross")}
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {money(totals.grossCents)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("totals.grossHint")}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Receipt className="size-5" />
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/40 to-primary/10" />
        </Card>

        <Card className="relative overflow-hidden border bg-card/60 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("totals.commission")}
              </p>
              <p className="text-2xl font-bold tracking-tight text-amber-600 tabular-nums dark:text-amber-400">
                −{money(totals.commissionCents)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {effectiveRate
                  ? t("totals.commissionRate", { rate: effectiveRate })
                  : t("totals.commissionHint")}
                {" · "}
                {t("totals.vatOf", { vat: money(totals.commissionVatCents) })}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Percent className="size-5" />
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
        </Card>

        <Card className="relative overflow-hidden border bg-card/60 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {owedToMerchant ? t("totals.net") : t("totals.owedByYou")}
              </p>
              <p
                className={`text-2xl font-bold tracking-tight tabular-nums ${
                  owedToMerchant
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {money(Math.abs(totals.merchantNetCents))}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("totals.netHint")}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="size-5" />
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300" />
        </Card>
      </div>

      {/* Period + what happens next. */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {t("period.label")}
          </span>{" "}
          {formatDate(statement.periodStart, locale)} —{" "}
          {formatDate(statement.periodEnd, locale)}
        </div>
        <DecisionBadge decision={decision} />
      </div>

      {/* Exceptions first: they are the reason a balance looks wrong. */}
      {statement.exceptions.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4" />
            {t("exceptions.title", { count: statement.exceptions.length })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("exceptions.subtitle")}
          </p>
          <ul className="space-y-1.5 pt-1">
            {statement.exceptions.map((exception) => (
              <li
                key={`${exception.kind}-${exception.ref}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background/60 px-3 py-2 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className="shrink-0 border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                  >
                    {t(`exceptions.kind.${exception.kind}` as never)}
                  </Badge>
                  <span className="truncate text-muted-foreground">
                    {exception.detail}
                  </span>
                </div>
                <span className="font-semibold tabular-nums">
                  {money(exception.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Every movement, so the totals above can explain themselves. */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {statement.lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
              <Wallet className="size-8" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
              {t("lines.emptyTitle")}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {t("lines.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold">
                    {t("lines.kind")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    {t("lines.date")}
                  </TableHead>
                  <TableHead className="text-end text-xs font-semibold">
                    {t("lines.gross")}
                  </TableHead>
                  <TableHead className="text-end text-xs font-semibold">
                    {t("lines.commission")}
                  </TableHead>
                  <TableHead className="text-end text-xs font-semibold">
                    {t("lines.net")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.lines.map((line) => (
                  <TableRow key={`${line.kind}-${line.ref}`}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className={`w-fit gap-1.5 rounded-lg text-[11px] font-semibold ${LINE_KIND_CLASS[line.kind]}`}
                        >
                          {t(`lines.kinds.${line.kind}` as never)}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{line.ref.slice(-6).toUpperCase()}
                        </span>
                        {line.note && (
                          <span className="max-w-[220px] truncate text-[11px] text-muted-foreground">
                            {line.note}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(line.occurredAt, locale)}
                    </TableCell>
                    <TableCell className="text-end text-xs tabular-nums">
                      {money(line.grossCents)}
                    </TableCell>
                    <TableCell className="text-end text-xs tabular-nums text-amber-600 dark:text-amber-400">
                      {money(line.commissionCents)}
                    </TableCell>
                    <TableCell
                      className={`text-end text-xs font-semibold tabular-nums ${
                        line.merchantNetCents >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {money(line.merchantNetCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

const LINE_KIND_CLASS: Record<string, string> = {
  sale: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  refund: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  adjustment:
    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

/**
 * What happens to this balance next, in the merchant's own words.
 *
 * `blocked` is deliberately loud: the statement is correct, the money simply
 * cannot move until support has bank details on file, and discovering that on
 * transfer day is the failure this is meant to prevent.
 */
function DecisionBadge({
  decision,
}: {
  decision: PayoutStatement["decision"]
}) {
  const t = useTranslations("Dashboard.payouts")

  const config = {
    pay: {
      icon: ArrowUpRight,
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    collect: {
      icon: ArrowDownLeft,
      className:
        "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    },
    carry: {
      icon: Scale,
      className:
        "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400",
    },
    blocked: {
      icon: Ban,
      className:
        "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
  }[decision.action]

  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${config.className}`}
    >
      <Icon className="size-3.5" />
      {t(`decision.${decision.action}` as never)}
    </Badge>
  )
}
