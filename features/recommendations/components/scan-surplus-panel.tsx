"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useIsMutating } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { DegradedBanner } from "@/components/ai/degraded-banner"
import { getErrorMessage } from "@/lib/api/utils"
import { useScanSurplus } from "@/features/recommendations/hooks/use-recommendations"

export interface ScanSurplusPanelProps {
  /** The page title, translated server-side and passed down so the <h1>
   * can live in this client component alongside the button it sits next
   * to — see the layout note below. */
  title: string
}

export function ScanSurplusPanel({ title }: ScanSurplusPanelProps) {
  const t = useTranslations("recommendations")
  const scanMutation = useScanSurplus()
  const isGlobalScanning = useIsMutating({ mutationKey: ["scan-surplus"] }) > 0
  const isScanning = scanMutation.isPending || isGlobalScanning

  const [degradedReason, setDegradedReason] = React.useState<
    string | undefined
  >(undefined)
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <Button onClick={handleScan} disabled={isScanning}>
          {isScanning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isScanning ? t("scanning") : t("scanButton")}
        </Button>
      </div>
      {showDegraded && <DegradedBanner reason={degradedReason} />}
    </div>
  )
}
