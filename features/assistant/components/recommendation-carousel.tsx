"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, Loader2, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import type { AssistantRecommendation } from "@/features/assistant/api/type"

const PRIORITY_STYLES: Record<AssistantRecommendation["priority"], string> = {
  HIGH: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  MEDIUM:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  LOW: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
}

export interface RecommendationCarouselProps {
  recommendations: AssistantRecommendation[]
  applyingIndex: number | null
  onApply: (recommendation: AssistantRecommendation, index: number) => void
}

export function RecommendationCarousel({
  recommendations,
  applyingIndex,
  onApply,
}: RecommendationCarouselProps) {
  const t = useTranslations("Dashboard.assistant")
  const locale = useLocale()
  const isRtl = locale === "ar"
  const [rawIndex, setIndex] = useState(0)

  if (recommendations.length === 0) return null

  const count = recommendations.length
  // A new reply replaces the whole set, so a held index can point past the
  // end. Clamped here rather than in an effect to avoid a blank first frame.
  const index = Math.min(rawIndex, count - 1)
  const current = recommendations[index]
  const go = (step: number) => setIndex((i) => (i + step + count) % count)

  // In RTL "previous" sits on the right, so the glyphs swap with the direction.
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <div className="border-b border-border bg-gradient-to-b from-primary/8 to-transparent px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          <TrendingUp className="size-3.5 text-primary" />
          {t("recommendations.heading")}
        </span>

        {count > 1 && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-6 rounded-full"
              onClick={() => go(-1)}
              aria-label={t("recommendations.previous")}
            >
              <PrevIcon className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 rounded-full"
              onClick={() => go(1)}
              aria-label={t("recommendations.next")}
            >
              <NextIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.recommendationId ?? `${index}-${current.title}`}
          initial={{ opacity: 0, x: isRtl ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRtl ? 16 : -16 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-3 shadow-sm"
        >
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn("border", PRIORITY_STYLES[current.priority])}
            >
              {t(`recommendations.priority.${current.priority}`)}
            </Badge>
            {current.estimatedSaving > 0 && (
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/10 tabular-nums text-emerald-600 dark:text-emerald-400"
              >
                {t("recommendations.saving", {
                  amount: formatCurrency(current.estimatedSaving, locale),
                })}
              </Badge>
            )}
          </div>

          <h3
            dir="auto"
            className="font-heading text-sm leading-snug font-semibold"
          >
            {current.title}
          </h3>
          <p
            dir="auto"
            className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground"
          >
            {current.description}
          </p>

          <Button
            size="sm"
            className="mt-3 w-full rounded-full"
            disabled={applyingIndex !== null}
            onClick={() => onApply(current, index)}
          >
            {applyingIndex === index && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            {t("recommendations.apply")}
          </Button>
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {recommendations.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("recommendations.goTo", { index: i + 1 })}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
