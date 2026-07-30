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
}

/**
 * The table view every forecast chart ships alongside its chart.
 *
 * The brief specifies `date | predicted | actual | variance`, but the
 * `actual`/`variance` columns are deliberately absent (human-ruled during
 * code review, task-4-report.md): the backend has no daily-actuals source
 * anywhere in this app — `Prediction` only carries a week-level
 * `actualOrders` total (surfaced as text in `prediction-row.tsx`, next to
 * this table), and `DailyBreakdownItem` has no `actualQuantity` field at
 * all. Rendering an `actual`/`variance` column here would mean either
 * fabricating a per-day split of the week total or showing an "—" in
 * every cell of two entire columns forever, neither of which is honest
 * table data. `ForecastChart` still accepts an `actuals` prop (correct
 * forward compatibility per the brief) — if a per-day actuals source is
 * ever wired in there, reinstate the two columns here using the same
 * `actuals` shape.
 */
export function ForecastTable({ breakdown }: ForecastTableProps) {
  const t = useTranslations("predictions")
  const locale = useLocale()

  const rows = breakdown.map((d) => ({
    date: d.date,
    label: new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(`${d.date}T12:00:00Z`)),
    predicted: d.predictedQuantity,
  }))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t("date")}</TableHead>
          <TableHead className="text-end">{t("predicted")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.date}>
            <TableCell className="text-start">{row.label}</TableCell>
            <TableCell className="text-end tabular-nums">
              {formatQty(row.predicted, locale)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
