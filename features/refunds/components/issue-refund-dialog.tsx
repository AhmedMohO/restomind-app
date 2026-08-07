"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createRefundAction } from "../actions"

/**
 * Support issues a refund against one order group.
 *
 * This is the ONLY way a refund is created. The API restricts
 * `POST /orders/group/:groupId/refunds` to admins, so there is deliberately no
 * merchant- or customer-facing equivalent — a refund reverses commission and
 * moves a customer's money, and both need support to have looked at it.
 *
 * Refunds the whole group. Per-order and per-line-item refunds exist on the
 * API and belong on the order details screen, where the items are actually
 * listed; offering them here would mean asking an operator to type indexes.
 */
export function IssueRefundDialog({
  groupId,
  reference,
  open,
  onOpenChange,
  onIssued,
}: {
  groupId: string | null
  /** Short human reference shown for confirmation, e.g. "4F2A19C0". */
  reference?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onIssued?: () => void
}) {
  const t = useTranslations("Dashboard.refunds")
  const [reason, setReason] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (open) setReason("")
  }, [open])

  function handleSubmit() {
    if (!groupId) return
    startTransition(async () => {
      const result = await createRefundAction(groupId, {
        reason: reason.trim(),
      })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        onIssued?.()
      } else {
        // The API's refusals here are specific and actionable — a closed
        // dispute window, an over-refund, an order in a terminal status.
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {t("issue.title")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {reference
              ? t("issue.descriptionWithRef", { reference })
              : t("issue.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1 text-xs">
          <Textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("issue.reasonPlaceholder")}
            className="rounded-xl text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            {t("issue.hint")}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!reason.trim() || isPending}
            onClick={handleSubmit}
            className="gap-2 rounded-xl"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            {t("issue.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
