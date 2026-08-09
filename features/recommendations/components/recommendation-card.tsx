"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { Quote } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn, getImageUrl } from "@/lib/utils"
import { formatEgp, formatPercent } from "@/lib/charts/format"
import type { Recommendation } from "@/features/recommendations/api/type"

const STATUS_STYLES: Record<Recommendation["status"], string> = {
  pending:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  edited: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  approved:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-transparent",
}

export interface RecommendationCardProps {
  recommendation: Recommendation
  onApprove: (id: string) => void
  onEdit: (recommendation: Recommendation) => void
  onDismiss: (id: string) => void
  isApproving?: boolean
  isDismissing?: boolean
}

export function RecommendationCard({
  recommendation,
  onApprove,
  onEdit,
  onDismiss,
  isApproving,
  isDismissing,
}: RecommendationCardProps) {
  const t = useTranslations("recommendations")
  const locale = useLocale()

  const product =
    typeof recommendation.productId === "string"
      ? null
      : recommendation.productId
  // An unpopulated productId (bare ObjectId string) or a populated product
  // with a null price both mean "we don't actually know the price" — do
  // not default either case to 0, since `null ?? 0` silently produces the
  // same fabricated EGP 0.00 as a missing product would.
  const hasPrice = product != null && typeof product.price === "number"
  const title = product?.title ?? t("unknownProduct")
  const price = hasPrice ? product.price : 0
  const offerPrice = price * (1 - recommendation.suggestedValue / 100)

  const isActionable =
    recommendation.status === "pending" || recommendation.status === "edited"

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {/* Image + discount sticker */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
        <Image
          src={getImageUrl(product?.image?.secure_url)}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />

        {/* The discount is the visual anchor: a sale-sticker corner tag. */}
        <Badge className={cn("absolute start-3 top-3 z-30 border")}>
          -{formatPercent(recommendation.suggestedValue / 100, locale)}
        </Badge>

        <Badge
          className={cn(
            "absolute end-3 top-3 border",
            STATUS_STYLES[recommendation.status]
          )}
        >
          {t(`status.${recommendation.status}`)}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="line-clamp-1 font-heading text-sm font-semibold">
              {title}
            </h3>
          </div>
          {hasPrice ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-heading text-sm font-semibold text-foreground">
                <span className="sr-only">{t("offerPrice")}: </span>
                {formatEgp(offerPrice, locale)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                <span className="sr-only">{t("originalPrice")}: </span>
                {formatEgp(price, locale)}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground italic">
              {t("priceUnavailable")}
            </p>
          )}
        </div>

        {/* AI marketing copy — Egyptian Arabic, always rendered RTL regardless
            of UI locale, and in the Arabic display face so it reads as
            authored copy rather than a mis-rendered string. */}
        <div className="rounded-md border-s-2 border-primary/40 bg-muted/40 p-2.5">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            <Quote className="size-3" />
            {t("aiCopyLabel")}
          </div>
          <p
            dir="auto"
            className="font-[family-name:var(--font-arabic)] text-sm leading-relaxed text-foreground/90"
          >
            {recommendation.gptExplanation}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={!isActionable || isApproving}
            onClick={() => onApprove(recommendation._id)}
          >
            {t("approve")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={!isActionable}
            onClick={() => onEdit(recommendation)}
          >
            {t("edit")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!isActionable || isDismissing}
            onClick={() => onDismiss(recommendation._id)}
          >
            {t("dismiss")}
          </Button>
        </div>
      </div>
    </Card>
  )
}
