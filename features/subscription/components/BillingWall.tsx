"use client"

import { useState, useTransition } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { CreditCard, Loader2, ShieldCheck, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BILLING_INTERVALS,
  type BillingInterval,
} from "@/features/plans/api/type"
import { startCheckoutAction } from "../actions"
import type { MySubscription, PaymentMethod } from "../api/type"
import IntervalToggle from "./IntervalToggle"
import PlanCard from "./PlanCard"

interface Props {
  subscription: MySubscription
  methods: PaymentMethod[]
}

const METHOD_ICON: Record<PaymentMethod, typeof CreditCard> = {
  card: CreditCard,
  wallet: Wallet,
}

/**
 * The paywall an unpaid or expired merchant sees instead of the dashboard.
 *
 * Structured as three visible steps rather than an error page: the merchant
 * has a task to complete, not a failure to absorb. The reassurance line is
 * permanent and prominent because the most common reaction to a paywall is
 * fear of having lost work.
 */
export default function BillingWall({ subscription, methods }: Props) {
  const t = useTranslations("Dashboard.billing")
  // Start on the interval the merchant already holds, so a renewal is one
  // click. A trial holds none, so it falls back to the shortest on sale.
  const [interval, setInterval] = useState<BillingInterval>(() =>
    defaultInterval(subscription)
  )
  // Default to something they can actually buy on that interval.
  const [selectedSlug, setSelectedSlug] = useState<string>(() =>
    defaultPlan(subscription, defaultInterval(subscription))
  )
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "card")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const format = useFormatter()

  // The backend already resolves which plan is current, trial included, so
  // the frontend no longer keeps its own copy of the trial-tier rule.
  const currentPlan =
    subscription.state === "trial" || subscription.state === "active"
      ? subscription.plans.find((plan) => plan.isCurrent)
      : undefined

  const activeUntil = formatDate(
    format,
    subscription.state === "trial"
      ? subscription.trialEndsAt
      : subscription.currentPeriodEnd
  )

  // A month bought now may not start today. Saying so is the whole answer to
  // "if I pay during my free trial, do I lose the rest of it?" — the merchant
  // should never have to find out by watching the date change.
  const startsOn = formatDate(format, subscription.nextPeriodStart)
  const startsLater =
    startsOn !== null &&
    new Date(subscription.nextPeriodStart).getTime() - Date.now() > 60_000

  const renewableOn = formatDate(format, subscription.renewableFrom)
  const selected = subscription.plans.find(
    (plan) => plan.slug === selectedSlug
  )
  const selectedOption = selected?.intervals[interval] ?? null
  const canBuySelected = selectedOption?.purchasable ?? false

  /**
   * Switching interval can strand the selection: the chosen plan may not sell
   * the new interval, or may not be purchasable on it. Move to one that is,
   * rather than leaving a dead Pay button pointing at nothing.
   */
  function handleIntervalChange(next: BillingInterval) {
    setInterval(next)
    const stillValid = subscription.plans.find(
      (plan) => plan.slug === selectedSlug
    )?.intervals[next]?.purchasable
    if (!stillValid) setSelectedSlug(defaultPlan(subscription, next))
  }

  function handlePay() {
    setError(null)
    startTransition(async () => {
      const result = await startCheckoutAction(selectedSlug, interval, method)
      if ("error" in result) {
        setError(result.error)
        return
      }
      window.location.href = result.checkoutUrl
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {subscription.state === "expired"
            ? t("expiredTitle")
            : subscription.state === "active"
              ? t("activeTitle")
              : t("unpaidTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed font-medium text-muted-foreground sm:text-lg">
          {subscription.state === "active" ? t("activeSubtitle") : t("subtitle")}
        </p>
      </header>

      {/* What the merchant already has. Without this the screen reads as a
          demand for money to someone who has already paid, which is how a
          second, unintended purchase gets made. */}
      {currentPlan && (
        <section className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border bg-muted/40 px-5 py-4 text-center shadow-xs">
          <span className="text-base font-semibold text-foreground">
            {subscription.state === "trial"
              ? t("currentTrial", { tier: currentPlan.label })
              : t("currentPlan", {
                  // The snapshotted label, so an archived or renamed plan
                  // still reads as what they actually bought.
                  tier: subscription.planLabel ?? currentPlan.label,
                })}
          </span>
          {activeUntil && (
            <span className="text-sm font-medium text-muted-foreground">
              {subscription.state === "trial"
                ? t("freeUntil", { date: activeUntil })
                : t("paidUntil", { date: activeUntil })}
            </span>
          )}
        </section>
      )}

      {/* Step 1 — Choose a plan */}
      <section aria-labelledby="plans-heading" className="space-y-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-xs">
            1
          </span>
          <div>
            <h2
              id="plans-heading"
              className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {t("stepPlan")}
            </h2>
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              {t("productCount", { count: subscription.productCount })}
            </p>
          </div>
        </div>

        <IntervalToggle
          plans={subscription.plans}
          value={interval}
          onChange={handleIntervalChange}
        />

        <div className="grid gap-5 pt-2 sm:grid-cols-3">
          {subscription.plans.map((plan) => (
            <PlanCard
              key={plan.slug}
              plan={plan}
              interval={interval}
              selected={plan.slug === selectedSlug}
              recommended={
                !subscription.tier &&
                plan.slug === recommendedPlan(subscription)
              }
              onSelect={() => setSelectedSlug(plan.slug)}
              t={t}
            />
          ))}
        </div>
      </section>

      {/* Step 2 — Pay securely */}
      <section
        aria-labelledby="pay-heading"
        className="space-y-5 rounded-2xl border bg-card/60 p-6 shadow-xs sm:p-8"
      >
        <div className="flex items-center gap-3 border-b pb-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-xs">
            2
          </span>
          <h2
            id="pay-heading"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {t("stepPay")}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {methods.map((m) => {
              const Icon = METHOD_ICON[m]
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-5 py-3 text-base font-medium shadow-xs transition-all",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    method === m
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {t(`method.${m}`)}
                </button>
              )
            })}
          </div>

          {error && (
            <p role="alert" className="text-base font-medium text-destructive">
              {error}
            </p>
          )}

          <div>
            <Button
              size="lg"
              className="w-full rounded-xl px-8 py-6 text-base font-semibold shadow-md transition-all hover:scale-[1.01] sm:w-auto"
              onClick={handlePay}
              disabled={isPending || !canBuySelected}
            >
              {isPending && (
                <Loader2 className="me-2 size-5 animate-spin" aria-hidden />
              )}
              {isPending
                ? t("redirecting")
                : t(
                    selectedSlug === subscription.tier ? "renewCta" : "payCta",
                    {
                      amount:
                        selectedOption?.priceEGP.toLocaleString() ?? "",
                    }
                  )}
            </Button>

            {/* Why the button is dead, said plainly. An unexplained disabled
                button reads as a broken page, not as a deliberate rule. */}
            {!canBuySelected && renewableOn && (
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {subscription.state === "trial"
                  ? t("lockedDuringTrial", { date: renewableOn })
                  : t("lockedUntilRenewal", { date: renewableOn })}
              </p>
            )}

            {canBuySelected && startsLater && (
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {subscription.state === "trial"
                  ? t("startsAfterTrial", { date: startsOn })
                  : t("startsAfterPeriod", { date: startsOn })}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Reassurance banner */}
      <section className="flex items-start gap-4 rounded-2xl border bg-emerald-500/5 p-5 shadow-xs sm:p-6 dark:bg-emerald-950/20">
        <ShieldCheck
          className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-500"
          aria-hidden
        />
        <div>
          <p className="text-base font-bold text-foreground sm:text-lg">
            {t("safeTitle")}
          </p>
          <p className="mt-1 text-sm leading-relaxed font-normal text-muted-foreground sm:text-base">
            {t("safeBody")}
          </p>
        </div>
      </section>
    </div>
  )
}

function formatDate(
  format: ReturnType<typeof useFormatter>,
  iso: string | null
): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return format.dateTime(date, { day: "numeric", month: "long" })
}

/**
 * The interval to land on.
 *
 * The one they already hold, so renewing is a single click. A trial holds
 * none, so it falls back to the shortest interval actually on sale.
 */
function defaultInterval(subscription: MySubscription): BillingInterval {
  if (subscription.interval) return subscription.interval

  return (
    BILLING_INTERVALS.find((candidate) =>
      subscription.plans.some((plan) => plan.intervals[candidate] !== null)
    ) ?? "monthly"
  )
}

/** The first plan the merchant is actually allowed to buy on `interval`. */
function defaultPlan(
  subscription: MySubscription,
  interval: BillingInterval
): string {
  const buyable = subscription.plans.filter(
    (plan) => plan.intervals[interval]?.purchasable
  )

  return (
    buyable.find((plan) => plan.slug === subscription.tier)?.slug ??
    buyable.find((plan) => plan.fitsCurrentCatalogue)?.slug ??
    buyable[0]?.slug ??
    recommendedPlan(subscription)
  )
}

/** The smallest plan that actually fits the current catalogue. */
function recommendedPlan(subscription: MySubscription): string {
  return (
    subscription.plans.find((plan) => plan.fitsCurrentCatalogue)?.slug ??
    subscription.plans[subscription.plans.length - 1]?.slug ??
    ""
  )
}
