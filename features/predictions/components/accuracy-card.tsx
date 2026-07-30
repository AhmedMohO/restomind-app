"use client"

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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useChartColors } from "@/lib/charts/palette"
import { formatPercent } from "@/lib/charts/format"
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
  const locale = useLocale()
  const colors = useChartColors()
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

  const chartData = weeks.map((w) => ({
    week: w.targetWeek,
    label: new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(new Date(`${w.targetWeek}T12:00:00Z`)),
    mape: w.mape,
  }))

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
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">
                {t("accuracy.latestLabel")}
              </p>
              <p className="font-heading text-2xl font-semibold text-foreground">
                {latest === null ? "—" : formatPercent(latest, locale)}
              </p>
            </div>

            {/* No <Legend> — a single series is already named by the card
                title, per the dataviz mark spec. */}
            <div className="h-72 w-full">
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
                    axisLine={{ stroke: colors.axis }}
                    tickLine={false}
                    tick={{ fill: colors.muted, fontSize: 12 }}
                  />
                  <YAxis
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
