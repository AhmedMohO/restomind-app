"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"

export type ConfidenceLevel = "high" | "medium" | "low"

export function ConfidenceBadge({
  confidence,
}: {
  confidence: ConfidenceLevel
}) {
  const t = useTranslations("ai")
  return (
    <Badge variant="outline" className="tabular-nums">
      {t(`confidence.${confidence}`)}
    </Badge>
  )
}
