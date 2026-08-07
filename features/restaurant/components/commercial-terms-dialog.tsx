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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/api/utils"
import { useAdminUpdateRestaurant } from "../hooks/use-restaurant"
import type { Restaurant, UpdateRestaurantPayload } from "../types"

/**
 * The two money settings only support may touch: what RestoMind charges this
 * merchant, and where their payout is sent.
 *
 * Kept out of the shared restaurant form on purpose. That form is also the
 * manager's own edit screen, and the API rejects both of these fields from a
 * manager — putting them there would render controls that always fail.
 *
 * Leaving the rate blank clears the override, so the merchant falls back to the
 * platform default in system settings. That is a real state, not a missing
 * value, which is why an empty box is allowed to submit.
 */
export function CommercialTermsDialog({
  restaurant,
  open,
  onOpenChange,
  platformDefaultRate,
}: {
  restaurant: Restaurant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shown as the fallback when no override is set. A fraction. */
  platformDefaultRate?: number
}) {
  const t = useTranslations("Dashboard.restaurant")
  const update = useAdminUpdateRestaurant()

  // Percent in the box, fraction on the wire.
  const [ratePercent, setRatePercent] = React.useState("")
  const [method, setMethod] = React.useState<"bank" | "wallet">("bank")
  const [accountName, setAccountName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [bankName, setBankName] = React.useState("")

  // Re-seed whenever a different merchant is opened, so the dialog never shows
  // the previous restaurant's bank details.
  React.useEffect(() => {
    if (!restaurant) return
    // `null` is a cleared override, not a zero rate — both must show an empty
    // box, or reopening the dialog would present 0% as the negotiated deal.
    const rate = restaurant.commissionRate
    setRatePercent(
      rate === undefined || rate === null
        ? ""
        : String(Number((rate * 100).toFixed(4)))
    )
    setMethod(restaurant.payoutDestination?.method ?? "bank")
    setAccountName(restaurant.payoutDestination?.accountName ?? "")
    setAccountNumber(restaurant.payoutDestination?.accountNumber ?? "")
    setBankName(restaurant.payoutDestination?.bankName ?? "")
  }, [restaurant])

  const trimmedRate = ratePercent.trim()
  const parsedRate = Number(trimmedRate)
  const rateValid =
    trimmedRate === "" ||
    (Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 100)

  // Both identity fields or neither: a destination with a name and no account
  // number would pass the payout `hasDestination` check and then fail at the
  // bank, which is the one failure mode this screen exists to prevent.
  const destinationStarted = Boolean(
    accountName.trim() || accountNumber.trim()
  )
  const destinationValid =
    !destinationStarted || Boolean(accountName.trim() && accountNumber.trim())

  async function handleSave() {
    if (!restaurant) return

    const payload: UpdateRestaurantPayload = {}

    // Explicit null clears the override server-side. `undefined` would be
    // dropped by JSON.stringify and silently leave the old rate in place, so
    // "I cleared the box" and "I changed nothing" would send the same request.
    payload.commissionRate =
      trimmedRate === "" ? null : Number((parsedRate / 100).toFixed(6))

    if (destinationStarted) {
      payload.payoutDestination = {
        method,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        ...(bankName.trim() ? { bankName: bankName.trim() } : {}),
      }
    }

    try {
      await update.mutateAsync({ id: restaurant._id, payload })
      toast.success(t("terms.saved"))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, t("terms.saveError")))
    }
  }

  const fallbackPercent =
    platformDefaultRate !== undefined
      ? Number((platformDefaultRate * 100).toFixed(4))
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {t("terms.title")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {restaurant?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1 text-xs">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold">
              {t("terms.commission")}
            </Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={ratePercent}
              onChange={(event) => setRatePercent(event.target.value)}
              placeholder={
                fallbackPercent !== null
                  ? t("terms.commissionPlaceholder", {
                      percent: fallbackPercent,
                    })
                  : t("terms.commissionEmpty")
              }
              className="h-9 rounded-xl text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              {t("terms.commissionHint")}
            </p>
            {!rateValid && (
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                {t("terms.commissionInvalid")}
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <p className="text-[11px] font-semibold text-foreground">
              {t("terms.payoutDestination")}
            </p>

            <div className="space-y-1.5">
              <Label className="text-[11px]">{t("terms.method")}</Label>
              <Select
                value={method}
                onValueChange={(value) =>
                  value && setMethod(value as "bank" | "wallet")
                }
              >
                <SelectTrigger className="h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">{t("terms.bank")}</SelectItem>
                  <SelectItem value="wallet">{t("terms.wallet")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]">{t("terms.accountName")}</Label>
              <Input
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]">
                {method === "bank"
                  ? t("terms.iban")
                  : t("terms.walletNumber")}
              </Label>
              <Input
                dir="ltr"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                className="h-9 rounded-xl text-start text-xs"
              />
            </div>

            {method === "bank" && (
              <div className="space-y-1.5">
                <Label className="text-[11px]">{t("terms.bankName")}</Label>
                <Input
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              {t("terms.payoutHint")}
            </p>
            {!destinationValid && (
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                {t("terms.destinationIncomplete")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!rateValid || !destinationValid || update.isPending}
            onClick={handleSave}
            className="gap-2 rounded-xl"
          >
            {update.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {t("terms.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
