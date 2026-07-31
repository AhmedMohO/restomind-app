"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  CircleCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

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
import { RISK_COLORS, type RiskLevel } from "@/lib/charts/palette"
import { formatPercent, formatQty } from "@/lib/charts/format"
import { useWasteSummary } from "@/features/waste/hooks/use-waste"

const SUMMARY_WINDOW_DAYS = 30

const LEVELS: RiskLevel[] = ["low", "medium", "high"]

const RISK_ICONS: Record<RiskLevel, LucideIcon> = {
  low: CircleCheck,
  medium: AlertCircle,
  high: TriangleAlert,
}

/**
 * A single horizontal stacked bar (brief Step 3) — NOT a pie chart. Status
 * colours (`RISK_COLORS`) never carry meaning alone, so every segment gets
 * a direct label (icon + count + `ai.risk.*` text) in the legend row below
 * the bar, and the legend is always present regardless of which view is
 * active. A 2px surface gap (Tailwind `gap-0.5`) separates the segments —
 * implemented with `flexGrow` weights + `flexBasis: 0` rather than
 * percentage widths, so the gap doesn't push the bar past 100% width.
 */
export function RiskBreakdownChart() {
  const t = useTranslations("waste")
  const tAi = useTranslations("ai")
  const locale = useLocale()
  const isRtl = locale === "ar"
  const [view, setView] = React.useState<"chart" | "table">("chart")

  const { data: summary, isLoading } = useWasteSummary(SUMMARY_WINDOW_DAYS)

  const breakdown = summary?.riskBreakdown ?? { low: 0, medium: 0, high: 0 }
  const total = breakdown.low + breakdown.medium + breakdown.high
  const visibleLevels = LEVELS.filter((level) => breakdown[level] > 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{t("riskBreakdown.title")}</CardTitle>
        {!isLoading && total > 0 ? (
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
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : total === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("riskBreakdown.empty")}
          </p>
        ) : view === "chart" ? (
          <div className="space-y-4">
            <div
              dir={isRtl ? "rtl" : "ltr"}
              role="img"
              aria-label={LEVELS.map(
                (level) => `${tAi(`risk.${level}`)}: ${breakdown[level]}`
              ).join(", ")}
              className="flex h-8 w-full gap-0.5 overflow-hidden rounded-lg bg-muted"
            >
              {visibleLevels.map((level) => (
                <div
                  key={level}
                  title={`${tAi(`risk.${level}`)}: ${formatQty(breakdown[level], locale)}`}
                  style={{
                    flexGrow: breakdown[level],
                    flexBasis: 0,
                    backgroundColor: RISK_COLORS[level],
                  }}
                  className="h-full min-w-0"
                />
              ))}
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LEVELS.map((level) => {
                const Icon = RISK_ICONS[level]
                return (
                  <li key={level} className="flex items-center gap-1.5 text-sm">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: RISK_COLORS[level] }}
                    />
                    <Icon
                      className="size-3.5 shrink-0"
                      style={{ color: RISK_COLORS[level] }}
                    />
                    <span className="font-medium text-foreground tabular-nums">
                      {formatQty(breakdown[level], locale)}
                    </span>
                    <span className="text-muted-foreground">
                      {tAi(`risk.${level}`)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">
                  {t("riskBreakdown.level")}
                </TableHead>
                <TableHead className="text-end">
                  {t("riskBreakdown.count")}
                </TableHead>
                <TableHead className="text-end">
                  {t("riskBreakdown.share")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEVELS.map((level) => {
                const Icon = RISK_ICONS[level]
                return (
                  <TableRow key={level}>
                    <TableCell className="text-start">
                      <span className="flex items-center gap-1.5">
                        <Icon
                          className="size-3.5 shrink-0"
                          style={{ color: RISK_COLORS[level] }}
                        />
                        {tAi(`risk.${level}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatQty(breakdown[level], locale)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatPercent(
                        total > 0 ? breakdown[level] / total : 0,
                        locale
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
