"use client"

import { useState, useTransition } from "react"
import { useFormatter, useTranslations } from "next-intl"
import { CreditCard, Loader2, Lock, ShieldCheck, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { startCheckoutAction } from "../actions"
import type {
  MySubscription,
  PaymentMethod,
  TierName,
  TierOption,
} from "../api/type"

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
  // Default to something they can actually buy. While a plan is still running
  // that is the next tier up; once it lapses it is the plan they already had.
  const [selectedTier, setSelectedTier] = useState<TierName>(
    () => defaultTier(subscription)
  )
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "card")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const format = useFormatter()

  const effectiveTier =
    subscription.state === "trial" ? TRIAL_TIER : subscription.tier
  const currentPlan =
    subscription.state === "trial" || subscription.state === "active"
      ? subscription.tiers.find((tier) => tier.name === effectiveTier)
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
  const selected = subscription.tiers.find(
    (tier) => tier.name === selectedTier
  )
  const canBuySelected = selected?.purchasable ?? false

  function handlePay() {
    setError(null)
    startTransition(async () => {
      const result = await startCheckoutAction(selectedTier, method)
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
              : t("currentPlan", { tier: currentPlan.label })}
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

        <div className="grid gap-5 pt-2 sm:grid-cols-3">
          {subscription.tiers.map((tier) => (
            <TierCard
              key={tier.name}
              tier={tier}
              selected={tier.name === selectedTier}
              recommended={
                !subscription.tier &&
                tier.name === recommendedTier(subscription)
              }
              current={tier.name === subscription.tier}
              lockedUntil={tier.purchasable ? null : renewableOn}
              onSelect={() => tier.purchasable && setSelectedTier(tier.name)}
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
                    selectedTier === subscription.tier ? "renewCta" : "payCta",
                    { amount: priceOf(subscription, selectedTier) }
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

function TierCard({
  tier,
  selected,
  recommended,
  current,
  lockedUntil,
  onSelect,
  t,
}: {
  tier: TierOption
  selected: boolean
  recommended: boolean
  current: boolean
  /** Non-null when this tier cannot be bought yet; the date it opens. */
  lockedUntil: string | null
  onSelect: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const locked = lockedUntil !== null

  return (
    <Card
      role="radio"
      aria-checked={selected}
      aria-disabled={locked}
      tabIndex={locked ? -1 : 0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "rounded-2xl p-5 shadow-xs transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        locked
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-foreground/30 hover:shadow-sm",
        selected &&
          "border-primary bg-primary/[0.03] shadow-md ring-2 ring-primary/20"
      )}
    >
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-foreground">
            {tier.label}
          </span>
          {current ? (
            <Badge
              variant="secondary"
              className="border-emerald-600/20 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400"
            >
              {t("yourPlan")}
            </Badge>
          ) : (
            recommended && (
              <Badge
                variant="secondary"
                className="border-primary/20 bg-primary/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-primary uppercase"
              >
                {t("recommended")}
              </Badge>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-0">
        <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
          {tier.priceEGP.toLocaleString()}
          <span className="ms-1.5 text-base font-normal text-muted-foreground">
            {t("perMonth")}
          </span>
        </p>

        <p className="pt-2 text-base font-medium text-foreground/90">
          {tier.productCap === null
            ? t("unlimitedProducts")
            : t("upToProducts", { cap: tier.productCap.toLocaleString() })}
        </p>
        {!tier.fitsCurrentCatalogue && (
          <p className="text-sm font-semibold text-destructive">
            {t("tooSmall")}
          </p>
        )}
        {locked && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            {current
              ? t("renewFrom", { date: lockedUntil })
              : t("availableFrom", { date: lockedUntil })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/** Mirrors TRIAL_TIER on the backend: a trial runs at Plus capacity. */
const TRIAL_TIER: TierName = "plus"

function formatDate(
  format: ReturnType<typeof useFormatter>,
  iso: string | null
): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return format.dateTime(date, { day: "numeric", month: "long" })
}

/** The first tier the merchant is actually allowed to buy today. */
function defaultTier(subscription: MySubscription): TierName {
  const buyable = subscription.tiers.filter((tier) => tier.purchasable)
  const preferred = buyable.find((tier) => tier.name === subscription.tier)
  return (
    preferred?.name ??
    buyable.find((tier) => tier.fitsCurrentCatalogue)?.name ??
    buyable[0]?.name ??
    recommendedTier(subscription)
  )
}

/** The smallest tier that actually fits the current catalogue. */
function recommendedTier(subscription: MySubscription): TierName {
  return (
    subscription.tiers.find((tier) => tier.fitsCurrentCatalogue)?.name ??
    subscription.tiers[subscription.tiers.length - 1]!.name
  )
}

function priceOf(subscription: MySubscription, name: TierName): string {
  const tier = subscription.tiers.find((candidate) => candidate.name === name)
  return tier ? tier.priceEGP.toLocaleString() : ""
}
