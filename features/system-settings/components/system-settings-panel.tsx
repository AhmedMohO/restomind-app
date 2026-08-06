"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Ticket, TimerReset } from "lucide-react"

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
}) {
  const t = useTranslations("Dashboard.systemSettings")
  // Seeded from the server value. The caller keys this component on that
  // value, so a saved change remounts the field with the new number rather
  // than syncing it back through an effect.
  const [draft, setDraft] = React.useState(String(value))

  const parsed = Number(draft)
  const valid =
    draft.trim() !== "" &&
    Number.isInteger(parsed) &&
    parsed >= min &&
    (max === undefined || parsed <= max)
  const dirty = valid && parsed !== value

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
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
          className="w-28"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!dirty || saving}
          onClick={() => onCommit(parsed)}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : t("save")}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">{hint}</p>
      {!valid && draft.trim() !== "" ? (
        <p className="text-destructive text-xs">
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

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">
          {t("seatsClaimed", {
            claimed: earlyBirdClaimed,
            cap: earlyBirdCap,
          })}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("seatsLeft", { left: earlyBirdSeatsLeft })}
        </span>
      </div>
      <div
        className="bg-muted h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={earlyBirdClaimed}
        aria-valuemin={0}
        aria-valuemax={earlyBirdCap}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      {earlyBirdSeatsLeft === 0 ? (
        <p className="text-muted-foreground text-xs">{t("seatsGone")}</p>
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
      <div className="space-y-4">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("loadFailed")}</CardTitle>
          <CardDescription>{t("loadFailedHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>{t("retry")}</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TimerReset className="size-4" />
            {t("trialTitle")}
          </CardTitle>
          <CardDescription>{t("trialDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="freeTrialEnabled">{t("trialToggle")}</Label>
              <p className="text-muted-foreground text-xs">
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
            />
          </div>

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
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="size-4" />
            {t("earlyBirdTitle")}
          </CardTitle>
          <CardDescription>{t("earlyBirdDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="earlyBirdEnabled">{t("earlyBirdToggle")}</Label>
              <p className="text-muted-foreground text-xs">
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
            />
          </div>

          <SeatMeter settings={settings} />

          <NumberSetting
            key={`earlyBirdCap-${settings.earlyBirdCap}`}
            id="earlyBirdCap"
            label={t("earlyBirdCap")}
            hint={t("earlyBirdCapHint")}
            value={settings.earlyBirdCap}
            min={0}
            saving={pendingKey === "earlyBirdCap"}
            onCommit={(next) => save({ earlyBirdCap: next }, "earlyBirdCap")}
          />

          <p className="text-muted-foreground border-t pt-4 text-xs">
            {t("grantHint")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
