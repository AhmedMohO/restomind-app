"use client"

import { useTranslations } from "next-intl"
import { CheckCircle2, Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface OrdersProgressCardProps {
  done: number
  total: number
  isLoading?: boolean
}

/**
 * Completion counter shown above the dashboard orders table: how many of the
 * orders matching the active filters have reached the "Delivered" status.
 */
export function OrdersProgressCard({
  done,
  total,
  isLoading = false,
}: OrdersProgressCardProps) {
  const t = useTranslations("Dashboard.orders")
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card className="rounded-2xl border-border bg-card p-0 shadow-2xs">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              {t("completionTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("completionSubtitle")}
            </p>
          </div>
        </div>

        <div className="w-full min-w-0 sm:max-w-xs">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="font-mono text-lg font-extrabold text-primary tabular-nums">
              {done} / {total}
            </span>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {percentage}%
            </span>
          </div>
          <Progress
            value={percentage}
            aria-label={t("completionTitle")}
            className="gap-0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
