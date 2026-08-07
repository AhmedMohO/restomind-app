"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle, Layers, Loader2, Sparkles } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"

import {
  BILLING_INTERVALS,
  INTERVAL_MONTHS,
  type BillingInterval,
  type Plan,
  type PlanCreate,
  type PlanPrices,
  type PlanUpdate,
} from "../api/type"
import {
  EMPTY_PRICES,
  draftToPrices,
  ladderViolation,
  toDraft,
  type PriceDraft,
} from "../utils"

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  saving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Undefined creates; a plan edits it. */
  plan?: Plan
  saving: boolean
  onSubmit: (body: PlanCreate | PlanUpdate) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/*
          Keyed so each opening mounts a fresh form: the fields initialise
          straight from `plan` rather than being reset by an effect, so a
          cancelled edit can never leak into the next one.
        */}
        {open && (
          <PlanForm
            key={plan?.slug ?? "__new__"}
            plan={plan}
            saving={saving}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PlanForm({
  plan,
  saving,
  onCancel,
  onSubmit,
}: {
  plan?: Plan
  saving: boolean
  onCancel: () => void
  onSubmit: (body: PlanCreate | PlanUpdate) => void
}) {
  const t = useTranslations("Dashboard.plans")
  const isEdit = Boolean(plan)

  const [slug, setSlug] = React.useState(plan?.slug ?? "")
  const [label, setLabel] = React.useState(plan?.label ?? "")
  const [cap, setCap] = React.useState(
    plan == null || plan.productCap === null ? "" : String(plan.productCap)
  )
  const [sortOrder, setSortOrder] = React.useState(String(plan?.sortOrder ?? 0))
  const [isTrialPlan, setIsTrialPlan] = React.useState(
    plan?.isTrialPlan ?? false
  )
  const [prices, setPrices] = React.useState<PriceDraft>(
    plan ? toDraft(plan.prices) : EMPTY_PRICES
  )

  const parsedPrices = draftToPrices(prices)
  const violation = ladderViolation(parsedPrices)
  const nothingPriced = BILLING_INTERVALS.every(
    (interval) => parsedPrices[interval] === null
  )
  const slugValid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)

  const blocked =
    saving ||
    !label.trim() ||
    (!isEdit && !slugValid) ||
    nothingPriced ||
    violation !== null

  const submit = () => {
    const capValue = cap.trim() === "" ? null : Number(cap)
    const common = {
      label: label.trim(),
      productCap: capValue,
      prices: parsedPrices,
      sortOrder: Number(sortOrder) || 0,
      isTrialPlan,
    }
    onSubmit(isEdit ? common : { ...common, slug: slug.trim() })
  }

  return (
    <>
      <DialogHeader className="gap-1">
        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-4" />
          </div>
          {isEdit ? t("editTitle") : t("createTitle")}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {isEdit ? t("editDescription") : t("createDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="grid max-h-[calc(100vh-20rem)] gap-5 overflow-y-auto py-3">
        {/* Slug and Label */}
        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="plan-slug" className="text-xs font-semibold">
              {t("slug")}
            </Label>
            <Input
              id="plan-slug"
              value={slug}
              disabled={isEdit}
              placeholder="enterprise"
              className="font-mono text-sm"
              onChange={(event) => setSlug(event.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              {isEdit ? t("slugLocked") : t("slugHint")}
            </p>
            {!isEdit && slug !== "" && !slugValid && (
              <p className="text-[11px] font-medium text-destructive">
                {t("slugInvalid")}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="plan-label" className="text-xs font-semibold">
              {t("label")}
            </Label>
            <Input
              id="plan-label"
              value={label}
              placeholder="Enterprise"
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
        </div>

        {/* Product Limit & Sort Order */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="plan-cap" className="text-xs font-semibold">
              {t("productCap")}
            </Label>
            <Input
              id="plan-cap"
              type="number"
              min={1}
              value={cap}
              placeholder={t("unlimited")}
              onChange={(event) => setCap(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="plan-order" className="text-xs font-semibold">
              {t("sortOrder")}
            </Label>
            <Input
              id="plan-order"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </div>
        </div>

        {/* Pricing Ladder Section */}
        <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
          <div>
            <Label className="text-xs font-semibold">{t("pricesEGP")}</Label>
            <p className="text-[11px] text-muted-foreground">
              {t("pricesHint")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BILLING_INTERVALS.map((interval) => {
              const val = prices[interval].trim()
              const numVal = val !== "" ? Number(val) : null
              const perMo =
                numVal !== null && Number.isFinite(numVal) && numVal >= 0
                  ? Math.round(numVal / INTERVAL_MONTHS[interval])
                  : null

              return (
                <div
                  key={interval}
                  className="grid gap-1.5 rounded-lg border border-border/50 bg-card p-2.5 shadow-2xs"
                >
                  <Label
                    htmlFor={`price-${interval}`}
                    className="text-xs font-medium text-foreground"
                  >
                    {t(`interval.${interval}`)}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`price-${interval}`}
                      type="number"
                      min={0}
                      value={prices[interval]}
                      placeholder="—"
                      className="pe-11 font-semibold tabular-nums"
                      onChange={(event) =>
                        setPrices((previous) => ({
                          ...previous,
                          [interval]: event.target.value,
                        }))
                      }
                    />
                    <span className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-xs text-muted-foreground">
                      {t("egp")}
                    </span>
                  </div>
                  {perMo !== null && (
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {t("perMonth", { amount: perMo.toLocaleString() })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {violation && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                {t("ladderWarning", { interval: t(`interval.${violation}`) })}
              </span>
            </div>
          )}
        </div>

        {/* Trial Plan Toggle Card */}
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
            isTrialPlan
              ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
              : "border-border/60 bg-card"
          }`}
        >
          <div className="grid gap-0.5">
            <Label
              htmlFor="plan-trial"
              className="flex items-center gap-1.5 text-sm font-semibold"
            >
              <Sparkles className="size-4 text-amber-500" />
              {t("trialPlan")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("trialPlanHint")}
            </p>
          </div>
          <Switch
            id="plan-trial"
            checked={isTrialPlan}
            onCheckedChange={setIsTrialPlan}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button onClick={submit} disabled={blocked} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? t("save") : t("create")}
        </Button>
      </DialogFooter>
    </>
  )
}
