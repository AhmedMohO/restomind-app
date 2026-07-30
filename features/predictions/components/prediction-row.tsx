"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { ChevronDown, ImageOff, Loader2, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { ConfidenceBadge } from "@/components/ai/confidence-badge"
import { SourceBadge } from "@/components/ai/source-badge"
import { cn } from "@/lib/utils"
import { formatQty } from "@/lib/charts/format"
import type { Prediction } from "@/features/predictions/api/type"
import { useRecalculatePrediction } from "@/features/predictions/hooks/use-predictions"
import { ForecastChart } from "./forecast-chart"
import { ForecastTable } from "./forecast-table"

const COLUMN_COUNT = 7

function formatUpdatedAt(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export interface PredictionRowProps {
  prediction: Prediction
}

/**
 * One product's forecast. Collapsed, it's the row a manager scans down;
 * expanded, it's the model's explainability payload — the daily curve plus
 * the `factors[]` chips — which is what turns an override into an informed
 * decision instead of a gut call.
 */
export function PredictionRow({ prediction }: PredictionRowProps) {
  const t = useTranslations("predictions")
  const tAi = useTranslations("ai")
  const locale = useLocale()
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<"chart" | "table">("chart")

  const product =
    typeof prediction.productId === "string" ? null : prediction.productId
  const productId =
    typeof prediction.productId === "string"
      ? prediction.productId
      : prediction.productId._id
  const title = product?.title ?? t("unknownProduct")

  const recalcMutation = useRecalculatePrediction({
    success: t("recalculateOneSuccess"),
    error: t("recalculateOneError"),
  })

  const factors = React.useMemo(
    () =>
      [...prediction.factors].sort(
        (a, b) => Math.abs(b.impact_pct) - Math.abs(a.impact_pct)
      ),
    [prediction.factors]
  )

  return (
    <>
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={open}
            aria-label={open ? t("collapseRow") : t("expandRow")}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
              {product?.image ? (
                <Image
                  src={product.image}
                  alt={title}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-4" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {title}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-end tabular-nums">
          {formatQty(prediction.predictedOrders, locale)}
        </TableCell>
        <TableCell>
          <ConfidenceBadge confidence={prediction.confidence} />
        </TableCell>
        <TableCell>
          <SourceBadge source={prediction.source} />
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {formatUpdatedAt(prediction.updatedAt, locale)}
        </TableCell>
        <TableCell className="text-end">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("recalculateOne")}
            disabled={recalcMutation.isPending}
            onClick={() =>
              recalcMutation.mutate({
                productId,
                targetWeek: prediction.targetWeek,
              })
            }
          >
            {recalcMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>

      {open ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="bg-muted/30 whitespace-normal">
            <div className="space-y-4 py-2">
              {prediction.actualOrders !== null ? (
                <p className="text-xs text-muted-foreground">
                  {t("actualWeekTotal")}: {formatQty(prediction.actualOrders, locale)}
                  {prediction.errorAbs !== null ? (
                    <>
                      {" "}
                      · {t("errorAbs")}: {formatQty(prediction.errorAbs, locale)}
                    </>
                  ) : null}
                </p>
              ) : null}

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

              {view === "chart" ? (
                <ForecastChart breakdown={prediction.dailyBreakdown} />
              ) : (
                <ForecastTable breakdown={prediction.dailyBreakdown} />
              )}

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t("factorsTitle")}
                </p>
                {factors.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {t("noFactors")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {factors.map((f) => {
                      const sign = f.impact_pct > 0 ? "+" : ""
                      const magnitude = new Intl.NumberFormat(locale, {
                        maximumFractionDigits: 1,
                      }).format(f.impact_pct)
                      const isPositive = f.impact_pct > 0
                      const isNegative = f.impact_pct < 0
                      return (
                        <Badge
                          key={f.factor}
                          variant="outline"
                          className="gap-1 tabular-nums"
                        >
                          <span>{f.factor}</span>
                          <span
                            className={cn(
                              isPositive &&
                                "text-emerald-600 dark:text-emerald-400",
                              isNegative && "text-red-600 dark:text-red-400"
                            )}
                          >
                            {sign}
                            {magnitude}%
                          </span>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
