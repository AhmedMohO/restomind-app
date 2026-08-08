"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  CircleCheck,
  PackageSearch,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { TableState } from "@/components/ui/table-state"
import { Link } from "@/i18n/routing"
import { useTableControls } from "@/hooks/use-table-controls"
import { formatQty } from "@/lib/charts/format"
import { RISK_COLORS, type RiskLevel } from "@/lib/charts/palette"
import {
  resolveIngredient,
  resolvePrediction,
  type WasteReport,
} from "@/features/waste/api/type"
import { useWasteReports } from "@/features/waste/hooks/use-waste"

const ALL_RISK_LEVELS = "all"
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"]

const RISK_ICONS: Record<RiskLevel, LucideIcon> = {
  low: CircleCheck,
  medium: AlertCircle,
  high: TriangleAlert,
}

function RiskChip({ level }: { level: RiskLevel }) {
  const tAi = useTranslations("ai")
  const Icon = RISK_ICONS[level]
  return (
    <Badge
      variant="outline"
      className="gap-1"
      style={{ borderColor: RISK_COLORS[level], color: RISK_COLORS[level] }}
    >
      <Icon className="size-3" />
      {tAi(`risk.${level}`)}
    </Badge>
  )
}

/**
 * The audit trail (brief Step 4): every column traces a discount decision
 * back to the forecast that justified it. `predictionId` is genuinely
 * populated now (hardening plan Task 7), but both refs can still come back
 * as bare id strings when unpopulated — `resolveIngredient`/
 * `resolvePrediction` guard both cases, never a cast.
 */
export function WasteTable() {
  const t = useTranslations("waste")
  const tAi = useTranslations("ai")
  const locale = useLocale()

  const [riskLevel, setRiskLevel] = React.useState<RiskLevel | "all">("all")
  const { page, setPage, limit, setLimit } = useTableControls({
    initialLimit: 10,
  })

  const { data, isLoading, isError, refetch } = useWasteReports({
    page,
    limit,
    riskLevel: riskLevel === ALL_RISK_LEVELS ? undefined : riskLevel,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("table.title")}
        </h2>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="waste-risk-filter"
            className="text-xs font-semibold whitespace-nowrap text-muted-foreground"
          >
            {t("table.riskFilter")}:
          </Label>
          <Select
            value={riskLevel}
            onValueChange={(v) => {
              if (!v) return
              setRiskLevel(v as RiskLevel | "all")
              setPage(1)
            }}
          >
            <SelectTrigger
              id="waste-risk-filter"
              aria-label={t("table.riskFilter")}
              className="w-44"
            >
              <SelectValue placeholder={t("table.riskFilter")}>
                {riskLevel === ALL_RISK_LEVELS
                  ? t("table.riskFilter")
                  : tAi(`risk.${riskLevel}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_RISK_LEVELS}>
                {t("table.riskFilter")}
              </SelectItem>
              {RISK_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {tAi(`risk.${level}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={items.length === 0}
          onRetry={() => refetch()}
          errorText={t("table.fetchError")}
          retryText={t("table.retry")}
          emptyIcon={PackageSearch}
          emptyTitle={t("table.empty")}
          emptyDescription={t("table.emptyHint")}
        >
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">
                  {t("table.ingredient")}
                </TableHead>
                <TableHead className="text-end">
                  {t("table.expectedConsumption")}
                </TableHead>
                <TableHead className="text-end">
                  {t("table.usableStock")}
                </TableHead>
                <TableHead className="text-end">
                  {t("table.expectedSurplus")}
                </TableHead>
                <TableHead className="text-start">{t("table.risk")}</TableHead>
                <TableHead className="text-start">
                  {t("table.prediction")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((report: WasteReport) => {
                const ingredient = resolveIngredient(report.ingredientId)
                const prediction = resolvePrediction(report.predictionId)
                const unit = ingredient?.unit ?? ""

                return (
                  <TableRow key={report._id}>
                    <TableCell className="text-start">
                      <span className="font-medium text-foreground">
                        {ingredient?.name ?? t("table.unknownIngredient")}
                      </span>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatQty(report.expectedConsumption, locale)} {unit}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatQty(report.usableAvailableStock, locale)} {unit}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatQty(report.expectedSurplus, locale)} {unit}
                    </TableCell>
                    <TableCell className="text-start">
                      <RiskChip level={report.riskLevel} />
                    </TableCell>
                    <TableCell className="text-start">
                      {prediction ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto flex-col items-start gap-0.5 px-2 py-1.5"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/dashboard/predictions?targetWeek=${encodeURIComponent(prediction.targetWeek)}`}
                              />
                            }
                          >
                            <bdi
                              dir="ltr"
                              className="text-xs font-medium tabular-nums"
                            >
                              {prediction.targetWeek}
                            </bdi>
                            <span className="text-xs text-muted-foreground">
                              {t("table.viewPrediction")} ·{" "}
                              {formatQty(prediction.predictedOrders, locale)}
                            </span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t("table.noPrediction")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableState>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  )
}
