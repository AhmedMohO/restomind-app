"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  AlertCircle,
  Calendar,
  Check,
  Info,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  TimerReset,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

import {
  useSystemSettings,
  useUpdateSystemSettings,
} from "../hooks/use-system-settings"
import type { SystemSettings, SystemSettingsUpdate } from "../api/type"

/**
 * A number an admin edits and then commits, rather than one that saves on
 * every keystroke — typing "30" over "14" passes through "3", and a trial
 * length of 3 days is a real setting that would briefly become true.
 */
function NumberSetting({
  id,
  label,
  hint,
  value,
  min,
  max,
  disabled,
  saving,
  onCommit,
  icon: Icon,
}: {
  id: string
  label: string
  hint: string
  value: number
  min: number
  max?: number
  disabled?: boolean
  saving: boolean
  onCommit: (next: number) => void
  icon?: React.ElementType
}) {
  const t = useTranslations("Dashboard.systemSettings")
  const [draft, setDraft] = React.useState(String(value))

  const parsed = Number(draft)
  const valid =
    draft.trim() !== "" &&
    Number.isInteger(parsed) &&
    parsed >= min &&
    (max === undefined || parsed <= max)
  const dirty = valid && parsed !== value

  return (
    <div
      className={`rounded-xl border border-border/40 bg-muted/20 p-4 transition-all ${
        disabled
          ? "pointer-events-none opacity-60"
          : "hover:border-border/70 hover:bg-muted/30"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label
            htmlFor={id}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            {Icon && <Icon className="size-4 text-muted-foreground" />}
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative flex items-center">
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              value={draft}
              disabled={disabled || saving}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && dirty) onCommit(parsed)
              }}
              className="w-28 text-center font-medium transition-colors focus-visible:ring-primary/30"
            />
          </div>

          <Button
            type="button"
            size="sm"
            variant={dirty ? "default" : "outline"}
            disabled={!dirty || saving}
            onClick={() => onCommit(parsed)}
            className="gap-1.5 transition-all"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : dirty ? (
              <Check className="size-3.5" />
            ) : null}
            {t("save")}
          </Button>
        </div>
      </div>

      {dirty && (
        <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
          Unsaved changes
        </div>
      )}

      {!valid && draft.trim() !== "" ? (
        <p className="mt-2 text-xs font-medium text-destructive">
          {t("invalidNumber", { min, max: max ?? "∞" })}
        </p>
      ) : null}
    </div>
  )
}

/** How many early-bird seats are gone, as a bar an admin can read at a glance. */
function SeatMeter({ settings }: { settings: SystemSettings }) {
  const t = useTranslations("Dashboard.systemSettings")
  const { earlyBirdClaimed, earlyBirdCap, earlyBirdSeatsLeft } = settings
  const percent =
    earlyBirdCap > 0
      ? Math.min(100, Math.round((earlyBirdClaimed / earlyBirdCap) * 100))
      : 100

  const isLow = earlyBirdSeatsLeft > 0 && earlyBirdSeatsLeft <= 5
  const isFull = earlyBirdSeatsLeft === 0

  return (
    <div className="space-y-3.5 rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 via-muted/20 to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="size-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {t("seatsClaimed", {
              claimed: earlyBirdClaimed,
              cap: earlyBirdCap,
            })}
          </span>
        </div>

        <Badge
          variant={isFull ? "destructive" : isLow ? "secondary" : "outline"}
          className={`px-2.5 py-0.5 text-xs font-medium ${
            !isFull && !isLow
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : isLow
                ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : ""
          }`}
        >
          {t("seatsLeft", { left: earlyBirdSeatsLeft })}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div
          className="h-3 w-full overflow-hidden rounded-full border border-border/30 bg-muted/80 p-0.5 shadow-inner"
          role="progressbar"
          aria-valuenow={earlyBirdClaimed}
          aria-valuemin={0}
          aria-valuemax={earlyBirdCap}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xs transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>{percent}% Claimed</span>
          <span>{earlyBirdCap} Total Seats</span>
        </div>
      </div>

      {isFull ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{t("seatsGone")}</span>
        </div>
      ) : null}
    </div>
  )
}

export function SystemSettingsPanel() {
  const t = useTranslations("Dashboard.systemSettings")
  const { data: settings, isPending, isError, refetch } = useSystemSettings()
  const update = useUpdateSystemSettings()

  // Which field is in flight, so only that control shows a spinner.
  const [pendingKey, setPendingKey] = React.useState<string | null>(null)

  const save = (body: SystemSettingsUpdate, key: string) => {
    setPendingKey(key)
    update.mutate(body, {
      onSuccess: () => toast.success(t("saved")),
      onError: (error: Error) => toast.error(error.message),
      onSettled: () => setPendingKey(null),
    })
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !settings) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertCircle className="size-5" />
              {t("loadFailed")}
            </CardTitle>
            <CardDescription>{t("loadFailedHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCw className="size-4" />
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
            <SlidersHorizontal className="size-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("title")}
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="space-y-6">
        {/* Card 1: Free Trial */}
        <Card className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-xs backdrop-blur-xs transition-all hover:shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <TimerReset className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {t("trialTitle")}
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                    {t("trialDescription")}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={settings.freeTrialEnabled ? "default" : "outline"}
                className={`hidden px-2.5 py-0.5 text-xs font-medium sm:inline-flex ${
                  settings.freeTrialEnabled
                    ? "border-amber-500/30 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                    : "text-muted-foreground"
                }`}
              >
                {settings.freeTrialEnabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            {/* Toggle Row */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-muted/30 p-4 transition-colors hover:bg-muted/40">
              <div className="space-y-1">
                <Label
                  htmlFor="freeTrialEnabled"
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  {t("trialToggle")}
                </Label>
                <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                  {t("trialToggleHint")}
                </p>
              </div>

              <Switch
                id="freeTrialEnabled"
                checked={settings.freeTrialEnabled}
                disabled={pendingKey === "freeTrialEnabled"}
                onCheckedChange={(checked) =>
                  save({ freeTrialEnabled: checked }, "freeTrialEnabled")
                }
                className="mt-0.5"
              />
            </div>

            {/* Trial Days Input */}
            <NumberSetting
              key={`trialDurationDays-${settings.trialDurationDays}`}
              id="trialDurationDays"
              label={t("trialDays")}
              hint={t("trialDaysHint")}
              value={settings.trialDurationDays}
              min={1}
              max={365}
              disabled={!settings.freeTrialEnabled}
              saving={pendingKey === "trialDurationDays"}
              onCommit={(next) =>
                save({ trialDurationDays: next }, "trialDurationDays")
              }
              icon={Calendar}
            />
          </CardContent>
        </Card>

        {/* Card 2: Early-Bird Pricing */}
        <Card className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-xs backdrop-blur-xs transition-all hover:shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Ticket className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {t("earlyBirdTitle")}
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                    {t("earlyBirdDescription")}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={settings.earlyBirdEnabled ? "default" : "outline"}
                className={`hidden px-2.5 py-0.5 text-xs font-medium sm:inline-flex ${
                  settings.earlyBirdEnabled
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                    : "text-muted-foreground"
                }`}
              >
                {settings.earlyBirdEnabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            {/* Toggle Row */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-muted/30 p-4 transition-colors hover:bg-muted/40">
              <div className="space-y-1">
                <Label
                  htmlFor="earlyBirdEnabled"
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  {t("earlyBirdToggle")}
                </Label>
                <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                  {t("earlyBirdToggleHint")}
                </p>
              </div>

              <Switch
                id="earlyBirdEnabled"
                checked={settings.earlyBirdEnabled}
                disabled={pendingKey === "earlyBirdEnabled"}
                onCheckedChange={(checked) =>
                  save({ earlyBirdEnabled: checked }, "earlyBirdEnabled")
                }
                className="mt-0.5"
              />
            </div>

            {/* Seat Meter Visual Progress */}
            <SeatMeter settings={settings} />

            {/* Seat Cap Setting Input */}
            <NumberSetting
              key={`earlyBirdCap-${settings.earlyBirdCap}`}
              id="earlyBirdCap"
              label={t("earlyBirdCap")}
              hint={t("earlyBirdCapHint")}
              value={settings.earlyBirdCap}
              min={0}
              saving={pendingKey === "earlyBirdCap"}
              onCommit={(next) => save({ earlyBirdCap: next }, "earlyBirdCap")}
              icon={Sparkles}
            />

            {/* Grant Hint Callout */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-muted-foreground dark:border-blue-800/30 dark:bg-blue-950/20">
              <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="leading-relaxed">{t("grantHint")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
