"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useChartColors } from "@/lib/charts/palette"
import { formatQty } from "@/lib/charts/format"
import type { DailyBreakdownItem } from "@/features/predictions/api/type"

interface ForecastChartProps {
  breakdown: DailyBreakdownItem[]
  /** Same 7 dates, actual units sold — omitted for a week not yet closed. */
  actuals?: Array<{ date: string; actualQuantity: number }>
}

/**
 * Predicted units per day for one product's target week.
 *
 * Single y-axis by design: predicted and actual are the same measure in the
 * same unit, so they share a scale. A second axis here would be the classic
 * dual-axis lie.
 */
export function ForecastChart({ breakdown, actuals }: ForecastChartProps) {
  const t = useTranslations("predictions")
  const locale = useLocale()
  const colors = useChartColors()
  const isRtl = locale === "ar"

  const actualByDate = new Map(
    (actuals ?? []).map((a) => [a.date, a.actualQuantity])
  )

  const data = breakdown.map((d) => ({
    date: d.date,
    label: new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
    }).format(new Date(`${d.date}T12:00:00Z`)),
    predicted: d.predictedQuantity,
    actual: actualByDate.get(d.date) ?? null,
  }))

  const hasActuals = data.some((d) => d.actual !== null)

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
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
            width={44}
            tick={{ fill: colors.muted, fontSize: 12 }}
            tickFormatter={(v: number) => formatQty(v, locale)}
          />
          <Tooltip
            cursor={{ fill: colors.grid, fillOpacity: 0.4 }}
            // No explicit param types here (deviation from the brief's
            // literal snippet, documented in task-4-report.md): recharts
            // 3.8's `Formatter<TValue, TName>` types `value` as
            // `TValue | undefined` and narrowing it to a bare `number`
            // fails `tsc`. Leaving the params unannotated lets TS infer
            // them contextually from the `formatter` prop instead.
            formatter={(value, name) => [
              formatQty(typeof value === "number" ? value : Number(value), locale),
              name === "predicted" ? t("predicted") : t("actual"),
            ]}
          />
          {/* Legend only because two series are present; a lone series would
              be named by the card title instead. */}
          {hasActuals ? (
            <Legend
              formatter={(name) =>
                name === "predicted" ? t("predicted") : t("actual")
              }
            />
          ) : null}
          <Bar
            dataKey="predicted"
            name="predicted"
            fill={colors.series1}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          {hasActuals ? (
            <Line
              type="monotone"
              dataKey="actual"
              name="actual"
              stroke={colors.series2}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              connectNulls
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
