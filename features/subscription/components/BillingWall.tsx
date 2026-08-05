"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Check, CreditCard, Loader2, ShieldCheck, Wallet } from "lucide-react"

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
  const t = useTranslations("billing")
  const [selectedTier, setSelectedTier] = useState<TierName>(
    () => recommendedTier(subscription)
  )
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "card")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {subscription.state === "expired"
            ? t("expiredTitle")
            : t("unpaidTitle")}
        </h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm sm:text-base">
          {t("subtitle")}
        </p>
      </header>

      <Steps current={1} />

      {/* Step 1 — choose a plan */}
      <section aria-labelledby="plans-heading" className="mt-8">
        <h2 id="plans-heading" className="sr-only">
          {t("stepPlan")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {subscription.tiers.map((tier) => (
            <TierCard
              key={tier.name}
              tier={tier}
              selected={tier.name === selectedTier}
              recommended={tier.name === recommendedTier(subscription)}
              onSelect={() => setSelectedTier(tier.name)}
              t={t}
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-center text-xs">
          {t("productCount", { count: subscription.productCount })}
        </p>
      </section>

      {/* Step 2 — pay */}
      <section aria-labelledby="pay-heading" className="mt-10">
        <h2 id="pay-heading" className="mb-3 text-sm font-medium">
          {t("stepPay")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {methods.map((m) => {
            const Icon = METHOD_ICON[m]
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  method === m
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(`method.${m}`)}
              </button>
            )
          })}
        </div>

        {error && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}

        <Button
          size="lg"
          className="mt-5 w-full sm:w-auto"
          onClick={handlePay}
          disabled={isPending}
        >
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isPending
            ? t("redirecting")
            : t("payCta", {
                amount: priceOf(subscription, selectedTier),
              })}
        </Button>
      </section>

      {/* The reassurance. Permanent, not a toast — losing work is the fear. */}
      <div className="bg-muted/40 mt-10 flex items-start gap-3 rounded-lg border p-4">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-500"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium">{t("safeTitle")}</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {t("safeBody")}
          </p>
        </div>
      </div>
    </div>
  )
}

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const t = useTranslations("billing")
  const labels = [t("stepPlan"), t("stepPay"), t("stepDone")]
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {labels.map((label, index) => {
        const step = index + 1
        const done = step < current
        const active = step === current
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-emerald-600 text-white",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
                aria-hidden
              >
                {done ? <Check className="size-3.5" /> : step}
              </span>
              <span
                className={cn(
                  "text-xs sm:text-sm",
                  active ? "font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </span>
            {step < labels.length && (
              <span className="bg-border h-px w-4 sm:w-10" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function TierCard({
  tier,
  selected,
  recommended,
  onSelect,
  t,
}: {
  tier: TierOption
  selected: boolean
  recommended: boolean
  onSelect: () => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "focus-visible:ring-ring cursor-pointer transition focus-visible:ring-2 focus-visible:outline-none",
        selected ? "border-primary ring-primary/20 ring-2" : "hover:border-foreground/20"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{tier.label}</span>
          {recommended && (
            <Badge variant="secondary" className="text-[11px]">
              {t("recommended")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <p className="text-2xl font-semibold tabular-nums">
          {tier.priceEGP.toLocaleString()}
          <span className="text-muted-foreground ms-1 text-sm font-normal">
            {t("perMonth")}
          </span>
        </p>
        {/* VAT broken out — the invoice must never surprise the merchant. */}
        <p className="text-muted-foreground text-xs tabular-nums">
          {t("vatBreakdown", {
            net: tier.netEGP.toFixed(2),
            vat: tier.vatEGP.toFixed(2),
          })}
        </p>
        <p className="pt-1 text-sm">
          {tier.productCap === null
            ? t("unlimitedProducts")
            : t("upToProducts", { cap: tier.productCap.toLocaleString() })}
        </p>
        {!tier.fitsCurrentCatalogue && (
          <p className="text-destructive text-xs">{t("tooSmall")}</p>
        )}
      </CardContent>
    </Card>
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
