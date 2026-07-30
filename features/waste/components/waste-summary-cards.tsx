"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Coins, Loader2, Recycle, Sparkles, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DegradedBanner } from "@/components/ai/degraded-banner"
import { getErrorMessage } from "@/lib/api/utils"
import { formatEgp, formatQty } from "@/lib/charts/format"
import { useScanSurplus } from "@/features/recommendations/hooks/use-recommendations"
import { useWasteSummary } from "@/features/waste/hooks/use-waste"

const SUMMARY_WINDOW_DAYS = 30

function StatTileSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="size-9 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  )
}

/**
 * Page header (title, scan action, degraded banner) plus the three stat
 * tiles from `GET /waste-reports/summary` (brief Step 2). Per the dataviz
 * form heuristic a single headline number is a stat tile, not a chart —
 * no plot, no tooltip layer here.
 *
 * Owns the scan action because there's no dedicated panel file in this
 * task's scope (unlike `ScanSurplusPanel` in Task 3) — this is the
 * top-of-page block, the same place that button lives on the
 * recommendations screen it's reused from.
 */
export function WasteSummaryCards() {
  const t = useTranslations("waste")
  const locale = useLocale()

  const { data: summary, isLoading } = useWasteSummary(SUMMARY_WINDOW_DAYS)

  const scanMutation = useScanSurplus()
  const [degradedReason, setDegradedReason] = React.useState<
    string | undefined
  >(undefined)
  const [showDegraded, setShowDegraded] = React.useState(false)

  const handleScan = () => {
    setShowDegraded(false)
    // Per-call callbacks are safe here specifically because the button below
    // is disabled while `scanMutation.isPending`, so a second `mutate()`
    // that could supersede this one's callbacks before it settles can never
    // fire — the same reasoning `ScanSurplusPanel` (Task 3) documents for
    // this exact mutation.
    scanMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.degraded) {
          setDegradedReason(result.degradedReason)
          setShowDegraded(true)
          // The backend commits waste reports before calling the AI, so a
          // degraded scan still changed data — a clean failure message
          // would be a lie about what's now in the table below.
          toast.success(t("scanDegradedSuccess"))
        } else {
          toast.success(t("scanSuccess"))
        }
      },
      onError: (err) => toast.error(getErrorMessage(err, t("scanError"))),
    })
  }

  const highRiskCount = summary?.riskBreakdown.high ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={handleScan} disabled={scanMutation.isPending}>
          {scanMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {scanMutation.isPending ? t("scanning") : t("scanButton")}
        </Button>
      </div>

      {showDegraded && <DegradedBanner reason={degradedReason} />}

      {isLoading || !summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTileSkeleton />
          <StatTileSkeleton />
          <StatTileSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("summary.totalSurplus")}
                  </span>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted text-muted-foreground">
                    <Recycle className="size-4" />
                  </div>
                </div>
                <p className="font-heading text-3xl font-semibold text-foreground">
                  {formatQty(summary.totalSurplusQuantity, locale)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("summary.wasteCost")}
                  </span>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted text-muted-foreground">
                    <Coins className="size-4" />
                  </div>
                </div>
                <p className="font-heading text-3xl font-semibold text-foreground">
                  {formatEgp(summary.totalEstimatedWasteCost, locale)}
                </p>
              </CardContent>
            </Card>

            <Card
              className={
                highRiskCount > 0 ? "border-destructive/30" : undefined
              }
            >
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("summary.highRiskCount")}
                  </span>
                  <div
                    className={
                      highRiskCount > 0
                        ? "flex size-9 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive"
                        : "flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted text-muted-foreground"
                    }
                  >
                    <TriangleAlert className="size-4" />
                  </div>
                </div>
                <p className="font-heading text-3xl font-semibold text-foreground">
                  {formatQty(highRiskCount, locale)}
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("summary.windowLabel", { days: summary.windowDays })}
          </p>
        </>
      )}
    </div>
  )
}
