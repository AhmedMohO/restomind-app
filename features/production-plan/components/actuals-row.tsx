"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  Check,
  ImageOff,
  Loader2,
  RotateCcw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatQty } from "@/lib/charts/format"
import { Button } from "@/components/ui/button"
import { ConfidenceBadge } from "@/components/ai/confidence-badge"
import { SourceBadge } from "@/components/ai/source-badge"
import {
  getProductId,
  type ProductionPlanItem,
} from "@/features/production-plan/api/type"
import { Input } from "@/components/ui/input"

export type RowSaveStatus = "idle" | "saving" | "saved" | "failed"

/**
 * The per-row save-state affordance — deliberately a small status light
 * rather than a text chip or toast-per-row: a kitchen worker glancing down
 * a list of a dozen products one-handed reads a color faster than a word,
 * the same way a kitchen ticket rail signals status by light, not label.
 * `idle` stays visually silent (a dim outline, no fill, no icon) so a plan
 * that's mostly untouched doesn't read as a wall of amber/red.
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
        "flex size-6 shrink-0 items-center justify-center rounded-full border",
        status === "idle" && "border-border bg-transparent",
        status === "saving" && "border-amber-500/60 bg-amber-500/10",
        status === "saved" && "border-emerald-500/60 bg-emerald-500/10",
        status === "failed" && "border-destructive/60 bg-destructive/10"
      )}
    >
      {status === "saving" ? (
        <Loader2 className="size-3.5 animate-spin text-amber-600 dark:text-amber-400" />
      ) : status === "saved" ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : status === "failed" ? (
        <AlertTriangle className="size-3.5 text-destructive" />
      ) : null}
    </span>
  )
}

export interface ActualsRowProps {
  item: ProductionPlanItem
  locale: string
  value: string
  status: RowSaveStatus
  errorMessage?: string
  /** Present only for a `failed` row caused by a network/5xx failure (never
   * for a `skipped` row — retrying that is pointless). Renders an inline
   * retry button next to the error message. */
  onRetry?: () => void
  onChange: (raw: string) => void
  onBlur: () => void
}

/**
 * One product in today's plan. Rendered as a card, not a `<table>` row —
 * this screen is used one-handed in a kitchen (brief: "optimise for large
 * tap targets and autosave, not density"), and a real `<table>` narrow
 * enough to avoid horizontal scroll on a phone can't fit a 44px input
 * without crushing every other column. A card reflows to a comfortable
 * single column on a phone and a wider row on a tablet/landscape screen
 * without ever needing horizontal scroll, at the cost of vertical density —
 * exactly the trade the brief asks for.
 */
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
  // const hasRange = item.lowerBound != null && item.upperBound != null

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
            {product?.image ? (
              <Image
                src={product.image.secure_url}
                alt={title}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-4" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ConfidenceBadge confidence={item.confidence} />
              <SourceBadge source={item.source} />
            </div>
          </div>
        </div>
        <StatusLight status={status} />
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{t("recommended")}</p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {formatQty(item.recommendedQty, locale)}
          </p>
          {/* {hasRange ? (
            // A numeric range's two Latin-numeral runs, separated by a
            // neutral en-dash, get visually reordered by the bidi algorithm
            // inside an RTL paragraph ("12–22" renders as "22–12") unless
            // isolated — confirmed by rendering this exact component in
            // Arabic (see task-5-report.md). Fix-round item 3: an earlier
            // version put `dir="ltr"` on the whole `<p>`, which also forced
            // this line's OWN text-align to resolve against its own (now
            // ltr) direction — "start" = left — instead of the ambient
            // page direction its unmarked sibling lines above use, so in
            // Arabic this line broke left while "Recommended"/the qty
            // stayed right-aligned. `<bdi>` isolates ONLY the digit run's
            // bidi ordering (an inline construct — it has no block-level
            // text-align of its own to fight with), leaving the `<p>`'s
            // alignment inherited from the ambient direction like its
            // siblings, in both locales.
            <p className="text-xs text-muted-foreground tabular-nums">
              <bdi dir="ltr">
                {formatQty(item.lowerBound!, locale)}–
                {formatQty(item.upperBound!, locale)}
              </bdi>
            </p>
          ) : null} */}
        </div>

        <div>
          <label
            htmlFor={`actual-${productId}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            {t("actualLabel")}
          </label>
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
            // Kitchen data-entry primitive: 44px minimum hit area, 16px+ text
            // so mobile Safari doesn't zoom on focus (brief, Step 2).
            className={cn(
              "w-24",
              status === "failed" ? "border-destructive" : "border-input"
            )}
          />
          {status === "failed" && errorMessage ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-xs text-destructive">{errorMessage}</p>
              {onRetry ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  // A retry tap sits right next to a save failure the
                  // worker was just about to move past — keep it a real
                  // tap target (Common kitchen-input sizing), not a bare
                  // text link.
                  className="h-8 min-w-11 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <RotateCcw className="size-3.5" />
                  {t("retryRow")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
