"use client"

import { useLocale, useTranslations } from "next-intl"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatQty } from "@/lib/charts/format"
import type { DailyBreakdownItem } from "@/features/predictions/api/type"

export interface ForecastTableProps {
  breakdown: DailyBreakdownItem[]
  /** Same 7 dates, actual units sold — omitted for a week not yet closed. */
  actuals?: Array<{ date: string; actualQuantity: number }>
}

/**
 * The table view every forecast chart ships alongside its chart — the same
 * seven rows as `date | predicted | actual | variance`. Every value here is
 * also reachable by hovering the chart; this is the version that's always
 * reachable, chart or no chart.
 */
export function ForecastTable({ breakdown, actuals }: ForecastTableProps) {
  const t = useTranslations("predictions")
  const locale = useLocale()

  const actualByDate = new Map(
    (actuals ?? []).map((a) => [a.date, a.actualQuantity])
  )

  const rows = breakdown.map((d) => {
    const label = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(`${d.date}T12:00:00Z`))
    const actual = actualByDate.get(d.date) ?? null
    const variance = actual === null ? null : actual - d.predictedQuantity

    return {
      date: d.date,
      label,
      predicted: d.predictedQuantity,
      actual,
      variance,
    }
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t("date")}</TableHead>
          <TableHead className="text-end">{t("predicted")}</TableHead>
          <TableHead className="text-end">{t("actual")}</TableHead>
          <TableHead className="text-end">{t("variance")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.date}>
            <TableCell className="text-start">{row.label}</TableCell>
            <TableCell className="text-end tabular-nums">
              {formatQty(row.predicted, locale)}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {row.actual === null ? "—" : formatQty(row.actual, locale)}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {row.variance === null
                ? "—"
                : `${row.variance > 0 ? "+" : ""}${formatQty(row.variance, locale)}`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
