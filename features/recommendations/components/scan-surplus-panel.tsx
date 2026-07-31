"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

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

/**
 * The page's title/scan-button row, plus its degraded-AI banner. A client
 * component because both the scan button and the banner's visibility need
 * client state: the mutation itself, and whether the last scan came back
 * degraded.
 *
 * Layout note (fix round 1, item 6): the banner is rendered as a
 * block-level sibling BELOW the title/button row, not inside it.
 * Reproduced and confirmed the bug this replaces: with the banner nested
 * as a flex item opposite the <h1> inside
 * `flex flex-wrap items-center justify-between`, the Alert's `w-full`
 * resolves against that flex item's own shrink-to-fit width (flex items
 * don't get the normal block "fill parent" behavior), so the banner
 * rendered squeezed into a narrow column matching the row's remaining
 * space instead of spanning the page — and at narrower viewports the row
 * wrapped, pushing the title onto its own line above a still-narrow
 * banner. Keeping the banner as a sibling below the row (a plain block
 * context, not a flex item) lets it span full width like every other
 * alert on this page.
 */
export function ScanSurplusPanel({ title }: ScanSurplusPanelProps) {
  const t = useTranslations("recommendations")
  const scanMutation = useScanSurplus()
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
        <Button onClick={handleScan} disabled={scanMutation.isPending}>
          {scanMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {scanMutation.isPending ? t("scanning") : t("scanButton")}
        </Button>
      </div>
      {showDegraded && <DegradedBanner reason={degradedReason} />}
    </div>
  )
}
