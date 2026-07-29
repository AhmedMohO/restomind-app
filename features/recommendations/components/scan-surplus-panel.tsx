"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DegradedBanner } from "@/components/ai/degraded-banner"
import { getErrorMessage } from "@/lib/api/utils"
import { useScanSurplus } from "@/features/recommendations/hooks/use-recommendations"

/**
 * The scan button and its degraded-AI banner. Split out from the page (a
 * server component) because both need client state: the mutation itself,
 * and whether the last scan came back degraded.
 */
export function ScanSurplusPanel() {
  const t = useTranslations("recommendations")
  const scanMutation = useScanSurplus()
  const [degradedReason, setDegradedReason] = React.useState<string | undefined>(
    undefined
  )
  const [showDegraded, setShowDegraded] = React.useState(false)

  const handleScan = () => {
    setShowDegraded(false)
    scanMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.degraded) {
          setDegradedReason(result.degradedReason)
          setShowDegraded(true)
          // The backend commits waste reports before calling the AI, so a
          // degraded scan still changed data — say so, don't pretend it failed.
          toast.success(t("scanDegradedSuccess"))
        } else {
          toast.success(t("scanSuccess"))
        }
      },
      onError: (err) => toast.error(getErrorMessage(err, t("scanError"))),
    })
  }

  return (
    <div className="space-y-3">
      {showDegraded && <DegradedBanner reason={degradedReason} />}
      <Button onClick={handleScan} disabled={scanMutation.isPending}>
        {scanMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {scanMutation.isPending ? t("scanning") : t("scanButton")}
      </Button>
    </div>
  )
}
