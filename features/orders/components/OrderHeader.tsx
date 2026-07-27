"use client"

import { useState } from "react"
import { PackageCheck, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/routing"
import { clientFetch } from "@/lib/api/fetch-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { ApiOrderGroup } from "@/features/orders/api/type"
import { getStatusMeta } from "@/features/orders/status"
import { cn } from "@/lib/utils"

interface OrderHeaderProps {
  orderGroup: ApiOrderGroup
  formattedDate: string
  t: (key: string) => string
  showCancelButton?: boolean
}

export default function OrderHeader({
  orderGroup,
  formattedDate,
  t,
  showCancelButton = false,
}: OrderHeaderProps) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const statusMeta = getStatusMeta(orderGroup.overallStatus)
  const StatusIcon = statusMeta.Icon
  const displayId = orderGroup.groupOrderId
  const shortDisplayId = displayId.slice(-8).toUpperCase()
  const hasDiscount = orderGroup.totalDiscount > 0
  const discountPercent =
    hasDiscount && orderGroup.totalOriginalPrice > 0
      ? Math.round(
          (orderGroup.totalDiscount / orderGroup.totalOriginalPrice) * 100
        )
      : 0

  const isCancellable =
    showCancelButton &&
    (orderGroup.overallStatus === "Pending" ||
      orderGroup.overallStatus === "Confirmed" ||
      orderGroup.overallStatus === "Preparing")

  const handleConfirmCancel = async () => {
    if (!displayId) return
    setIsCancelling(true)
    try {
      const data = await clientFetch<ApiOrderGroup>(
        `/orders/group/${encodeURIComponent(displayId)}/cancel`,
        { method: "PATCH" }
      )
      if (data) {
        toast.success(
          t("orderCancelledSuccess") || "Order cancelled successfully"
        )
        router.refresh()
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel order"
      )
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <Card className="rounded-[28px] border-border bg-card p-0 shadow-xs md:rounded-[32px]">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center md:p-6">
          <div className="flex min-w-0 items-center gap-3 text-start">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
              <PackageCheck className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {t("orderNo")} #{shortDisplayId}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                    statusMeta.badgeClass
                  )}
                >
                  <StatusIcon className="size-3.5" />
                  <span>{t(statusMeta.labelKey)}</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground md:text-sm">
                {formattedDate ? `${formattedDate} · ` : ""}
                {orderGroup.totalQuantity} {t("items")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isCancellable && (
              <Button
                variant="destructive"
                size="sm"
                disabled={isCancelling}
                onClick={() => setShowCancelDialog(true)}
                className="rounded-full text-xs font-bold"
              >
                {isCancelling ? (
                  <Loader2 className="me-1.5 size-3.5 animate-spin" />
                ) : (
                  <XCircle className="me-1.5 size-3.5" />
                )}
                <span>{t("cancelOrder") || "Cancel Order"}</span>
              </Button>
            )}

            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-start sm:text-end">
              <div className="font-serif text-2xl font-extrabold text-primary">
                {orderGroup.finalTotalPrice.toFixed(2)} EGP
              </div>
              {hasDiscount && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("saved")} {orderGroup.totalDiscount.toFixed(2)} EGP (
                  {discountPercent}% OFF)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
        title={t("confirmCancelTitle") || "Cancel Order"}
        description={
          t("confirmCancelDesc") ||
          "Are you sure you want to cancel this order? This action cannot be undone."
        }
        confirmText={t("cancelOrder") || "Cancel Order"}
        cancelText={t("keepOrder") || "Keep Order"}
        variant="destructive"
      />
    </>
  )
}
