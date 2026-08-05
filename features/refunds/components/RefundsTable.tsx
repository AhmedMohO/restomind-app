"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { AlertTriangle, Check, Loader2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { reviewRefundAction } from "../actions"
import {
  formatRefundAmount,
  needsAttention,
  type ApiRefund,
  type RefundStatus,
} from "../api/type"

const STATUS_STYLE: Record<
  RefundStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  requested: { label: "Awaiting review", variant: "default" },
  approved: { label: "Approved", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  succeeded: { label: "Refunded", variant: "outline" },
  rejected: { label: "Rejected", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
  manual_required: { label: "Needs manual payout", variant: "destructive" },
}

export default function RefundsTable({ refunds }: { refunds: ApiRefund[] }) {
  const [rejecting, setRejecting] = useState<ApiRefund | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function review(
    refund: ApiRefund,
    decision: "approve" | "reject",
    reason?: string
  ) {
    setPendingId(refund._id)
    startTransition(async () => {
      const result = await reviewRefundAction(refund._id, decision, reason)
      setPendingId(null)
      setRejecting(null)
      setRejectionReason("")
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  if (!refunds.length) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        No refunds yet.
      </div>
    )
  }

  // Anything needing a human first — a refund sitting unnoticed is a customer
  // waiting for their money.
  const sorted = [...refunds].sort((a, b) => {
    const aNeeds = needsAttention(a.status) ? 0 : 1
    const bNeeds = needsAttention(b.status) ? 0 : 1
    if (aNeeds !== bNeeds) return aNeeds - bNeeds
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Amount (EGP)</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((refund) => {
              const style = STATUS_STYLE[refund.status]
              const busy = isPending && pendingId === refund._id
              return (
                <TableRow key={refund._id}>
                  <TableCell>
                    <Badge variant={style.variant}>{style.label}</Badge>
                    {refund.settlementMode === "offline" && (
                      <span className="text-muted-foreground ms-2 text-xs">
                        cash
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {formatRefundAmount(refund.amountCents)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {refund.lineItemIndexes?.length
                      ? `${refund.lineItemIndexes.length} item(s)`
                      : refund.orderId
                        ? "One restaurant"
                        : "Whole order"}
                  </TableCell>
                  <TableCell className="max-w-[22rem] text-sm">
                    <p className="truncate">{refund.reason}</p>
                    {/* The gateway's own words, verbatim — an operator
                        settling this offline needs to know why. */}
                    {refund.gatewayError && (
                      <p className="text-destructive mt-1 flex items-start gap-1 text-xs">
                        <AlertTriangle
                          className="mt-0.5 size-3 shrink-0"
                          aria-hidden
                        />
                        {refund.gatewayError}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {new Date(refund.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">
                    {refund.status === "requested" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => review(refund, "approve")}
                        >
                          {busy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => setRejecting(refund)}
                        >
                          <X className="size-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this refund request?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            The customer will not be refunded. Tell them why — this reason is
            recorded against the request.
          </p>
          <Textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="e.g. Order was already prepared and collected"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || isPending}
              onClick={() =>
                rejecting && review(rejecting, "reject", rejectionReason.trim())
              }
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
