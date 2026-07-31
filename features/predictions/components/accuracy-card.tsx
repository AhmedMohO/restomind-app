"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useChartColors } from "@/lib/charts/palette"
import { formatPercent, formatQty } from "@/lib/charts/format"
import { useAccuracy } from "@/features/predictions/hooks/use-predictions"
import type { AccuracyWeek } from "@/features/predictions/api/type"

function latestNonNullMape(weeks: AccuracyWeek[]): number | null {
  let latest: AccuracyWeek | null = null
  for (const week of weeks) {
    if (week.mape === null) continue
    if (!latest || week.targetWeek > latest.targetWeek) latest = week
  }
  return latest?.mape ?? null
}

/**
 * Rolling forecast accuracy: one line, `mape` per closed week. `mape` from
 * the backend is already a ratio (0.15, not 15) — `formatPercent` expects
 * exactly that and does the ×100 + "%" itself.
 */
export function AccuracyCard() {
  const t = useTranslations("predictions")
  const tAi = useTranslations("ai")
  const locale = useLocale()
  const colors = useChartColors()
  const isRtl = locale === "ar"
  const [view, setView] = React.useState<"chart" | "table">("chart")
  const { data, isLoading } = useAccuracy(8)

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("accuracy.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    )
  }

  const weeks = data.weeks
  const latest = latestNonNullMape(weeks)

  const chartData = weeks.map((w) => {
    const date = new Date(`${w.targetWeek}T12:00:00Z`)
    return {
      week: w.targetWeek,
      // Guard against a malformed targetWeek reaching Intl — same class of
      // defensive check `OrderDetailsPage.tsx` uses for `createdAt`.
      label: Number.isNaN(date.getTime())
        ? w.targetWeek
        : new Intl.DateTimeFormat(locale, {
            month: "short",
            day: "numeric",
          }).format(date),
      mape: w.mape,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("accuracy.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {weeks.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("accuracy.noData")}</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("accuracy.latestLabel")}
                </p>
                <p className="font-heading text-2xl font-semibold text-foreground">
                  {latest === null ? "—" : formatPercent(latest, locale)}
                </p>
              </div>

              {/* Every chart ships a table view — the dataviz non-negotiable
                  applies here exactly as it does to ForecastChart. */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={view === "chart" ? "secondary" : "ghost"}
                  onClick={() => setView("chart")}
                >
                  {tAi("chartView")}
                </Button>
                <Button
                  size="sm"
                  variant={view === "table" ? "secondary" : "ghost"}
                  onClick={() => setView("table")}
                >
                  {tAi("tableView")}
                </Button>
              </div>
            </div>

            {view === "chart" ? (
              // No <Legend> — a single series is already named by the card
              // title, per the dataviz mark spec.
              <div dir={isRtl ? "rtl" : "ltr"} className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke={colors.grid}
                      strokeDasharray="0"
                    />
                    <XAxis
                      dataKey="label"
                      reversed={isRtl}
                      axisLine={{ stroke: colors.axis }}
                      tickLine={false}
                      tick={{ fill: colors.muted, fontSize: 12 }}
                    />
                    <YAxis
                      orientation={isRtl ? "right" : "left"}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tick={{ fill: colors.muted, fontSize: 12 }}
                      tickFormatter={(v: number) => formatPercent(v, locale)}
                    />
                    <Tooltip
                      cursor={{ stroke: colors.axis }}
                      // Unannotated params, same reasoning as forecast-chart.tsx:
                      // recharts 3.8's Formatter type rejects a bare
                      // `number | null` parameter annotation here.
                      formatter={(value) => [
                        value === null || value === undefined
                          ? "—"
                          : formatPercent(Number(value), locale),
                        t("accuracy.mape"),
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="mape"
                      stroke={colors.series1}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      // Null weeks break the line instead of interpolating
                      // through them — "not yet reconciled" must never read
                      // as "0% error".
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t("accuracy.week")}</TableHead>
                    <TableHead className="text-end">
                      {t("accuracy.predictionsCount")}
                    </TableHead>
                    <TableHead className="text-end">{t("accuracy.mape")}</TableHead>
                    <TableHead className="text-end">
                      {t("accuracy.totalPredicted")}
                    </TableHead>
                    <TableHead className="text-end">
                      {t("accuracy.totalActual")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeks.map((w) => (
                    <TableRow key={w.targetWeek}>
                      <TableCell className="text-start">{w.targetWeek}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatQty(w.predictions, locale)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {w.mape === null ? "—" : formatPercent(w.mape, locale)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatQty(w.totalPredicted, locale)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatQty(w.totalActual, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
