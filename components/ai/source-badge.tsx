"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type PredictionSource =
  | "ai_model"
  | "rule_based"
  | "fallback_naive"
  | "fallback_yesterday"

const FALLBACK_SOURCES: PredictionSource[] = [
  "fallback_naive",
  "fallback_yesterday",
]

/**
 * Provenance for a predicted number. A fallback figure must be visually
 * unmistakable — a manager acting on "estimated from last week" is making a
 * different decision than one acting on a model forecast.
 */
export function SourceBadge({ source }: { source: PredictionSource }) {
  const t = useTranslations("ai")
  const isFallback = FALLBACK_SOURCES.includes(source)

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant={isFallback ? "outline" : "secondary"}
          className={
            isFallback
              ? "border-amber-500/60 text-amber-700 dark:text-amber-400"
              : undefined
          }
        >
          {t(`source.${source}`)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{t(`sourceTooltip.${source}`)}</TooltipContent>
    </Tooltip>
  )
}
