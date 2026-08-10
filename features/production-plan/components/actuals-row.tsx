"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  Check,
  ChefHat,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react"

import { cn, getImageUrl } from "@/lib/utils"
import { formatQty } from "@/lib/charts/format"
import { Button } from "@/components/ui/button"
import { SourceBadge } from "@/components/ai/source-badge"
import { Progress } from "@/components/ui/progress"
import {
  getProductId,
  type ProductionPlanItem,
} from "@/features/production-plan/api/type"
import { Input } from "@/components/ui/input"

export type RowSaveStatus = "idle" | "saving" | "saved" | "failed"

/**
 * Status light showing saving status per row.
 */
function StatusLight({ status }: { status: RowSaveStatus }) {
  const t = useTranslations("productionPlan")
  const label =
    status === "saving"
      ? t("rowStatus.saving")
      : status === "saved"
        ? t("rowStatus.saved")
        : status === "failed"
          ? t("rowStatus.failed")
          : t("rowStatus.idle")

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
        status === "idle" &&
          "border-border/60 bg-muted/30 text-muted-foreground",
        status === "saving" &&
          "border-amber-500/60 bg-amber-500/10 shadow-xs shadow-amber-500/20",
        status === "saved" &&
          "border-emerald-500/60 bg-emerald-500/10 shadow-xs shadow-emerald-500/20",
        status === "failed" &&
          "border-destructive/60 bg-destructive/10 shadow-xs shadow-destructive/20"
      )}
    >
      {status === "saving" ? (
        <Loader2 className="size-3.5 animate-spin text-amber-600 dark:text-amber-400" />
      ) : status === "saved" ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : status === "failed" ? (
        <AlertTriangle className="size-3.5 text-destructive" />
      ) : (
        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      )}
    </span>
  )
}

export interface ActualsRowProps {
  item: ProductionPlanItem
  locale: string
  value: string
  status: RowSaveStatus
  errorMessage?: string
  onRetry?: () => void
  onChange: (raw: string) => void
  onBlur: () => void
}

export function ActualsRow({
  item,
  locale,
  value,
  status,
  errorMessage,
  onRetry,
  onChange,
  onBlur,
}: ActualsRowProps) {
  const t = useTranslations("productionPlan")
  const product = typeof item.productId === "string" ? null : item.productId
  const productId = getProductId(item)
  const title = product?.title ?? t("unknownProduct")

  const actualNum = value !== "" ? Number(value) : null
  const recNum = item.recommendedQty ?? 0
  const progressPercent =
    actualNum != null && recNum > 0
      ? Math.min(100, Math.round((actualNum / recNum) * 100))
      : 0

  // Variance determination
  let varianceState: "met" | "over" | "under" | "pending" = "pending"
  if (actualNum != null && actualNum > 0) {
    if (actualNum === recNum) varianceState = "met"
    else if (actualNum > recNum) varianceState = "over"
    else varianceState = "under"
  }

  const stepChange = (delta: number) => {
    const current = actualNum ?? 0
    const next = Math.max(0, current + delta)
    onChange(String(next))
  }

  const imageSrc = getImageUrl(product?.image?.secure_url)

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/95 p-4 shadow-xs transition-all hover:border-border hover:shadow-md dark:bg-card/90",
        status === "saving" && "border-amber-500/40 bg-amber-500/2",
        status === "saved" && "border-emerald-500/40 bg-emerald-500/2",
        status === "failed" && "border-destructive/40 bg-destructive/2"
      )}
    >
      {/* Top Header: Image, Title, AI Badge, Status Light */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/60 shadow-2xs">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={title}
                fill
                sizes="48px"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ChefHat className="size-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <SourceBadge source={item.source} />

              {/* Variance Badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                  varianceState === "met" &&
                    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  varianceState === "over" &&
                    "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                  varianceState === "under" &&
                    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                  varianceState === "pending" &&
                    "bg-muted/80 text-muted-foreground"
                )}
              >
                {t(`variance.${varianceState}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusLight status={status} />
        </div>
      </div>

      {/* Target Vs Actual Section */}
      <div className="mt-4 rounded-lg bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              {t("recommended")}
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                {formatQty(recNum, locale)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("units")}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>{actualNum != null ? `${progressPercent}%` : "0%"}</span>
            <span>
              {formatQty(actualNum ?? 0, locale)} / {formatQty(recNum, locale)}
            </span>
          </div>
          <Progress
            value={progressPercent}
            className={cn(
              "h-1.5 w-full bg-muted-foreground/15",
              varianceState === "met" && "[&>div]:bg-emerald-500",
              varianceState === "over" && "[&>div]:bg-blue-500",
              varianceState === "under" && "[&>div]:bg-amber-500"
            )}
          />
        </div>
      </div>

      {/* Actual Input & Steppers Controls */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`actual-${productId}`}
            className="text-xs font-semibold text-foreground"
          >
            {t("actualLabel")}
          </label>
          {actualNum != null && actualNum > 0 ? (
            <span className="text-xs text-muted-foreground">
              {status === "saved" ? t("rowStatus.saved") : ""}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Stepper Buttons */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stepChange(-10)}
              disabled={actualNum == null || actualNum <= 0}
              className="size-9 shrink-0 rounded-lg text-xs font-semibold"
              title="-10"
            >
              -10
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stepChange(-1)}
              disabled={actualNum == null || actualNum <= 0}
              className="size-9 shrink-0 rounded-lg text-muted-foreground"
              title="-1"
            >
              <Minus className="size-4" />
            </Button>
          </div>

          {/* Numeric Input */}
          <div className="relative flex-1">
            <Input
              id={`actual-${productId}`}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={value}
              onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={onBlur}
              placeholder="0"
              aria-invalid={status === "failed"}
              className={cn(
                "h-9 text-center font-bold tracking-tight text-foreground tabular-nums",
                status === "failed"
                  ? "border-destructive focus-visible:ring-destructive"
                  : status === "saved"
                    ? "border-emerald-500/50 bg-emerald-500/5 focus-visible:ring-emerald-500"
                    : "border-input"
              )}
            />
          </div>

          {/* Plus Quick Steppers */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stepChange(1)}
              className="size-9 shrink-0 rounded-lg text-muted-foreground"
              title="+1"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stepChange(10)}
              className="size-9 shrink-0 rounded-lg text-xs font-semibold"
              title="+10"
            >
              +10
            </Button>
          </div>
        </div>

        {/* Error message and retry button */}
        {status === "failed" && errorMessage ? (
          <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            <p className="flex-1 truncate">{errorMessage}</p>
            {onRetry ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-7 gap-1 px-2 text-xs font-semibold text-destructive hover:bg-destructive/20 hover:text-destructive"
              >
                <RotateCcw className="size-3.5" />
                {t("retryRow")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
