"use client"

import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { DegradedBanner } from "@/components/ai/degraded-banner"
import {
  useAiBackfill,
  useLearnedStatus,
} from "@/features/predictions/hooks/use-predictions"

/**
 * Per-product model training progress. `data.degraded` means the status
 * itself is a local guess (the AI service that would confirm it is down) —
 * `DegradedBanner` exists precisely to say that out loud rather than
 * present a guess as fact.
 */
export function LearningStatusStrip() {
  const t = useTranslations("predictions")
  // The per-product status label reuses Task 1's `ai.status.*` — it already
  // covers exactly the three states LearnedStatusItem.status can be
  // ("trained" | "learning" | "cold_start"), so a duplicate predictions.*
  // copy of the same three strings would just be a second place to keep in
  // sync with the type.
  const tAi = useTranslations("ai")
  const { data, isLoading } = useLearnedStatus()

  const backfillMutation = useAiBackfill({
    success: t("learning.backfillSuccess"),
    error: t("learning.backfillError"),
  })

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("learning.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  // The backfill shortcut only makes sense when nothing has trained yet but
  // there's sales history sitting there unused — otherwise it's either
  // already progressing on its own, or there's genuinely nothing to backfill.
  const showBackfill =
    data.trainedCount === 0 && data.items.some((item) => item.salesRecordsCount > 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{t("learning.title")}</CardTitle>
          <p className="mt-1 font-heading text-lg font-semibold text-foreground">
            {t("learning.headline", {
              trained: data.trainedCount,
              total: data.totalProducts,
            })}
          </p>
        </div>
        {showBackfill ? (
          <Button
            size="sm"
            variant="outline"
            disabled={backfillMutation.isPending}
            onClick={() => backfillMutation.mutate(undefined)}
          >
            {backfillMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            {backfillMutation.isPending
              ? t("learning.backfilling")
              : t("learning.backfillButton")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {data.degraded ? <DegradedBanner reason={data.degradedReason} /> : null}

        {data.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("learning.empty")}</p>
        ) : (
          <ul className="max-h-64 space-y-3 overflow-y-auto pe-1">
            {data.items.map((item) => (
              <li key={item.productId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-foreground">
                    {item.title}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {tAi(`status.${item.status}`)}
                  </Badge>
                </div>
                <Progress
                  value={Math.round(Math.min(1, Math.max(0, item.progress)) * 100)}
                  aria-label={item.title}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
