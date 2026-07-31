"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

/**
 * Rendered whenever an AI-backed response comes back with `degraded: true`.
 * Dismissal is per-mount, not persisted: if the next query is still degraded
 * the banner returns, because the condition is still true.
 */
export function DegradedBanner({ reason }: { reason?: string }) {
  const t = useTranslations("ai")
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <Alert variant="default" className="border-amber-500/50">
      <AlertTitle>{t("degraded.title")}</AlertTitle>
      <AlertDescription className="flex items-start justify-between gap-4">
        <span>
          {t("degraded.body")}
          {reason ? (
            <span className="text-muted-foreground block text-xs">{reason}</span>
          ) : null}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          {t("degraded.dismiss")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
