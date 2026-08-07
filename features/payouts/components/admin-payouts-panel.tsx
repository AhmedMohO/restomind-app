"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Banknote, Loader2, Scale, Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"
import {
  completePayoutAction,
  createAdjustmentAction,
  fetchPayoutHistoryAction,
  fetchStatementAction,
  recordPayoutAction,
} from "../actions"
import { toEgp, type Payout, type PayoutStatement } from "../api/type"
import { PayoutHistory } from "./payout-history"
import { StatementView } from "./statement-view"

/**
 * Support's settlement desk: read one merchant's balance, transfer it, confirm
 * the transfer landed, and post corrections.
 *
 * The adjustment form is the only UI for MerchantAdjustment. Without it the
 * model is unreachable from the app, and the only way to fix a late chargeback
 * or a goodwill credit is editing an order or a payout by hand — exactly what
 * the model exists to prevent.
 */
export function AdminPayoutsPanel() {
  const t = useTranslations("Dashboard.payouts")

  const [restaurantId, setRestaurantId] = React.useState("")
  const [restaurantName, setRestaurantName] = React.useState("")
  const [statement, setStatement] = React.useState<PayoutStatement | null>(null)
  const [history, setHistory] = React.useState<Payout[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const [payDialogOpen, setPayDialogOpen] = React.useState(false)
  const [payReference, setPayReference] = React.useState("")

  const [completing, setCompleting] = React.useState<Payout | null>(null)
  const [completeReference, setCompleteReference] = React.useState("")
  const [failureReason, setFailureReason] = React.useState("")

  const [adjustOpen, setAdjustOpen] = React.useState(false)
  const [adjustAmount, setAdjustAmount] = React.useState("")
  const [adjustReason, setAdjustReason] = React.useState("")

  const [isPending, startTransition] = React.useTransition()

  const load = React.useCallback(async (id: string) => {
    if (!id) return
    setIsLoading(true)
    const [nextStatement, nextHistory] = await Promise.all([
      fetchStatementAction(id),
      fetchPayoutHistoryAction(id),
    ])
    setStatement(nextStatement)
    setHistory(nextHistory)
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    if (restaurantId) void load(restaurantId)
  }, [restaurantId, load])

  function runAction(
    action: () => Promise<{ success: boolean; message: string }>
  ) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        toast.success(result.message)
        await load(restaurantId)
      } else {
        toast.error(result.message)
      }
    })
  }

  /**
   * The amount is never typed by hand — it is taken from the statement the
   * operator is looking at, and the API rejects it if the statement has moved
   * since. Letting someone type a figure here would defeat that check.
   */
  function handleRecordPayout() {
    if (!statement) return
    runAction(async () => {
      const result = await recordPayoutAction(restaurantId, {
        cutoffDate: new Date().toISOString().slice(0, 10),
        amountCents: Math.abs(statement.totals.merchantNetCents),
        reference: payReference.trim() || undefined,
      })
      if (result.success) {
        setPayDialogOpen(false)
        setPayReference("")
      }
      return result
    })
  }

  function handleComplete(failed: boolean) {
    if (!completing) return
    runAction(async () => {
      const result = await completePayoutAction(completing._id, {
        reference: completeReference.trim() || undefined,
        failureReason: failed ? failureReason.trim() : undefined,
      })
      if (result.success) {
        setCompleting(null)
        setCompleteReference("")
        setFailureReason("")
      }
      return result
    })
  }

  function handleAdjustment() {
    // EGP in, piasters out — the API only ever accepts integer piasters, and a
    // float here would round somewhere nobody can see.
    const amountCents = Math.round(Number(adjustAmount) * 100)
    if (!Number.isFinite(amountCents) || amountCents === 0) {
      toast.error(t("adjust.invalidAmount"))
      return
    }
    runAction(async () => {
      const result = await createAdjustmentAction(restaurantId, {
        amountCents,
        reason: adjustReason.trim(),
      })
      if (result.success) {
        setAdjustOpen(false)
        setAdjustAmount("")
        setAdjustReason("")
      }
      return result
    })
  }

  const canPay =
    statement !== null &&
    (statement.decision.action === "pay" ||
      statement.decision.action === "collect")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card/80 p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm space-y-1.5">
          <Label className="text-xs font-semibold">
            {t("admin.selectMerchant")}
          </Label>
          <PaginatedRestaurantSelect
            value={restaurantId}
            onValueChange={(value, restaurant) => {
              setRestaurantId(value)
              setRestaurantName(restaurant?.name ?? "")
            }}
          />
        </div>

        {statement && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!canPay || isPending}
              onClick={() => setPayDialogOpen(true)}
              className="h-9 gap-1.5 rounded-xl text-xs"
            >
              <Banknote className="size-3.5" />
              {statement.decision.action === "collect"
                ? t("admin.recordCollection")
                : t("admin.recordPayout")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setAdjustOpen(true)}
              className="h-9 gap-1.5 rounded-xl text-xs"
            >
              <Scale className="size-3.5" />
              {t("admin.newAdjustment")}
            </Button>
          </div>
        )}
      </div>

      {!restaurantId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
            <Store className="size-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold">
            {t("admin.pickTitle")}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {t("admin.pickDescription")}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 text-muted-foreground shadow-sm">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !statement ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-700 dark:text-rose-300">
          {t("admin.loadError")}
        </div>
      ) : (
        <>
          <h2 className="text-lg font-bold tracking-tight">
            {statement.restaurantName || restaurantName}
          </h2>
          <StatementView statement={statement} />

          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-tight">
              {t("history.title")}
            </h3>
            <PayoutHistory
              payouts={history}
              onComplete={(payout) => {
                setCompleting(payout)
                setCompleteReference(payout.reference ?? "")
                setFailureReason("")
              }}
            />
          </div>
        </>
      )}

      {/* Record transfer */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {t("admin.recordPayoutTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("admin.recordPayoutDesc")}
            </DialogDescription>
          </DialogHeader>

          {statement && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3.5">
                <span className="text-muted-foreground">
                  {t("admin.amountToTransfer")}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {toEgp(
                    Math.abs(statement.totals.merchantNetCents)
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  EGP
                </span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">
                  {t("admin.reference")}
                </Label>
                <Input
                  value={payReference}
                  onChange={(event) => setPayReference(event.target.value)}
                  placeholder={t("admin.referencePlaceholder")}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setPayDialogOpen(false)}
            >
              {t("admin.cancel")}
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={handleRecordPayout}
              className="gap-2 rounded-xl"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {t("admin.confirmRecord")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm or fail a pending transfer */}
      <Dialog
        open={Boolean(completing)}
        onOpenChange={(open) => !open && setCompleting(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {t("admin.completeTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("admin.completeDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold">
                {t("admin.reference")}
              </Label>
              <Input
                value={completeReference}
                onChange={(event) => setCompleteReference(event.target.value)}
                placeholder={t("admin.referencePlaceholder")}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold">
                {t("admin.failureReason")}
              </Label>
              <Input
                value={failureReason}
                onChange={(event) => setFailureReason(event.target.value)}
                placeholder={t("admin.failureReasonPlaceholder")}
                className="h-9 rounded-xl text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("admin.failureHint")}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!failureReason.trim() || isPending}
              onClick={() => handleComplete(true)}
              className="rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
            >
              {t("admin.markFailed")}
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleComplete(false)}
              className="gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {t("admin.markPaid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merchant adjustment */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {t("adjust.title")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("adjust.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold">
                {t("adjust.amount")}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={adjustAmount}
                onChange={(event) => setAdjustAmount(event.target.value)}
                placeholder="-150.00"
                className="h-9 rounded-xl text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("adjust.amountHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold">
                {t("adjust.reason")}
              </Label>
              <Textarea
                rows={3}
                value={adjustReason}
                onChange={(event) => setAdjustReason(event.target.value)}
                placeholder={t("adjust.reasonPlaceholder")}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setAdjustOpen(false)}
            >
              {t("admin.cancel")}
            </Button>
            <Button
              size="sm"
              disabled={!adjustReason.trim() || !adjustAmount || isPending}
              onClick={handleAdjustment}
              className="gap-2 rounded-xl"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {t("adjust.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
