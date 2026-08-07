"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle, Loader2 } from "lucide-react"

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
  ladderViolation,
  toCents,
  type BillingInterval,
  type Plan,
  type PlanCreate,
  type PlanPrices,
  type PlanUpdate,
} from "../api/type"

/** Prices are edited in whole EGP and submitted as cents. */
type PriceDraft = Record<BillingInterval, string>

const EMPTY_PRICES: PriceDraft = { monthly: "", halfYearly: "", yearly: "" }

function toDraft(prices: PlanPrices): PriceDraft {
  return {
    monthly: prices.monthly === null ? "" : String(prices.monthly / 100),
    halfYearly:
      prices.halfYearly === null ? "" : String(prices.halfYearly / 100),
    yearly: prices.yearly === null ? "" : String(prices.yearly / 100),
  }
}

/** An empty field means "not sold", which is null — never 0. */
function draftToPrices(draft: PriceDraft): PlanPrices {
  const parse = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === "") return null
    const value = Number(trimmed)
    return Number.isFinite(value) && value >= 0 ? toCents(value) : null
  }

  return {
    monthly: parse(draft.monthly),
    halfYearly: parse(draft.halfYearly),
    yearly: parse(draft.yearly),
  }
}

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
      <DialogContent className="sm:max-w-lg">
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
      <DialogHeader>
        <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        <DialogDescription>
          {isEdit ? t("editDescription") : t("createDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="plan-slug">{t("slug")}</Label>
            <Input
              id="plan-slug"
              value={slug}
              disabled={isEdit}
              placeholder="enterprise"
              onChange={(event) => setSlug(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              {isEdit ? t("slugLocked") : t("slugHint")}
            </p>
            {!isEdit && slug !== "" && !slugValid && (
              <p className="text-destructive text-xs">{t("slugInvalid")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-label">{t("label")}</Label>
            <Input
              id="plan-label"
              value={label}
              placeholder="Enterprise"
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-cap">{t("productCap")}</Label>
            <Input
              id="plan-cap"
              type="number"
              min={1}
              value={cap}
              placeholder={t("unlimited")}
              onChange={(event) => setCap(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("capHint")}</p>
          </div>

          <div className="grid gap-2">
            <Label>{t("pricesEGP")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {BILLING_INTERVALS.map((interval) => (
                <div key={interval} className="grid gap-1">
                  <Label
                    htmlFor={`price-${interval}`}
                    className="text-muted-foreground text-xs font-normal"
                  >
                    {t(`interval.${interval}`)}
                  </Label>
                  <Input
                    id={`price-${interval}`}
                    type="number"
                    min={0}
                    value={prices[interval]}
                    placeholder="—"
                    onChange={(event) =>
                      setPrices((previous) => ({
                        ...previous,
                        [interval]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">{t("pricesHint")}</p>

            {violation && (
              <p className="text-destructive flex items-start gap-1.5 text-xs">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {t("ladderWarning", { interval: t(`interval.${violation}`) })}
              </p>
            )}
            {nothingPriced && (
              <p className="text-destructive flex items-start gap-1.5 text-xs">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {t("noPriceWarning")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-order">{t("sortOrder")}</Label>
              <Input
                id="plan-order"
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="grid gap-0.5">
                <Label htmlFor="plan-trial" className="text-sm">
                  {t("trialPlan")}
                </Label>
                <p className="text-muted-foreground text-xs">
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
        </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button onClick={submit} disabled={blocked}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? t("save") : t("create")}
        </Button>
      </DialogFooter>
    </>
  )
}
