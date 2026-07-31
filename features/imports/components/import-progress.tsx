"use client"

import { useTranslations } from "next-intl"
import { Check, Loader2 } from "lucide-react"

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { ImportStage } from "@/features/imports/hooks/use-imports"

const STAGE_ORDER: ImportStage[] = ["uploading", "importing"]

/** Rough "how far along" value — there's no byte-level progress from
 * `fetch()`, so each named stage gets a fixed midpoint value rather than a
 * fake animated percentage. */
const STAGE_VALUE: Record<ImportStage, number> = {
  idle: 0,
  uploading: 35,
  importing: 80,
}

/**
 * The two-stage progress element for the chained upload+confirm mutation
 * (brief Step 1: "surface progress as two named stages ... in one progress
 * element"). Renders nothing while idle.
 */
export function ImportProgress({ stage }: { stage: ImportStage }) {
  const t = useTranslations("imports")
  if (stage === "idle") return null

  const label =
    stage === "uploading" ? t("progress.uploading") : t("progress.importing")

  return (
    <div
      className="space-y-3 rounded-xl border border-border bg-card/50 p-4"
      role="status"
      aria-live="polite"
    >
      {/* `Progress` appends its own Track+Indicator after `children` — only
          the label row belongs here, not another Track. */}
      <Progress value={STAGE_VALUE[stage]} aria-label={label}>
        <div className="mb-1.5 flex items-center justify-between">
          <ProgressLabel className="text-sm font-medium text-foreground">
            {label}
          </ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>

      <ol className="flex flex-wrap items-center gap-4 text-xs">
        {STAGE_ORDER.map((s, i) => {
          const isDone = STAGE_ORDER.indexOf(stage) > i
          const isActive = s === stage
          const stageLabel =
            s === "uploading"
              ? t("progress.uploading")
              : t("progress.importing")
          return (
            <li
              key={s}
              className={cn(
                "flex items-center gap-1.5",
                isActive
                  ? "font-medium text-primary"
                  : isDone
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] tabular-nums",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary"
                      : "border-border"
                )}
              >
                {isDone ? (
                  <Check className="size-2.5" />
                ) : (
                  <bdi dir="ltr">{i + 1}</bdi>
                )}
              </span>
              <span>{stageLabel}</span>
              {isActive && <Loader2 className="size-3 animate-spin" />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
