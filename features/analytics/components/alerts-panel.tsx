"use client"

import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { DashboardAlert, AlertSeverity } from "../types"

interface AlertsPanelProps {
  alerts: DashboardAlert[]
}

const severityConfig: Record<
  AlertSeverity,
  {
    icon: typeof AlertCircle
    bg: string
    border: string
    text: string
    badgeBg: string
  }
> = {
  critical: {
    icon: AlertCircle,
    bg: "bg-rose-50/80 dark:bg-rose-950/25",
    border: "border-rose-200 dark:border-rose-900/50",
    text: "text-rose-900 dark:text-rose-200",
    badgeBg: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50/80 dark:bg-amber-950/25",
    border: "border-amber-200 dark:border-amber-900/50",
    text: "text-amber-900 dark:text-amber-200",
    badgeBg: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50/80 dark:bg-blue-950/25",
    border: "border-blue-200 dark:border-blue-900/50",
    text: "text-blue-900 dark:text-blue-200",
    badgeBg: "bg-blue-500/15 text-blue-800 dark:text-blue-300",
  },
}

export function AlertsPanel({ alerts: initialAlerts }: AlertsPanelProps) {
  const t = useTranslations("Dashboard.analytics")
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const activeAlerts = initialAlerts.filter((a) => !dismissedIds.has(a.id))

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  if (activeAlerts.length === 0) {
    return (
      <Card className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              {t("allClearTitle")}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {t("allClearDesc")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {activeAlerts.map((alert) => {
        const cfg = severityConfig[alert.severity]
        const SeverityIcon = cfg.icon

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border p-3.5 shadow-2xs transition-all",
              cfg.bg,
              cfg.border
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SeverityIcon className={cn("size-5 shrink-0", cfg.text)} />
              <p
                className={cn(
                  "truncate text-xs leading-relaxed font-medium",
                  cfg.text
                )}
              >
                {t(alert.messageKey, { count: alert.count ?? 0 })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {alert.actionUrl && (
                <Button
                  nativeButton={false}
                  render={<Link href={alert.actionUrl} />}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 rounded-lg px-2.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10",
                    cfg.text
                  )}
                >
                  <span>{t("alertAction")}</span>
                  <ArrowRight className="ms-1 size-3" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDismiss(alert.id)}
                className="size-7 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Dismiss alert"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
