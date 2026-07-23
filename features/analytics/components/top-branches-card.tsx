"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Store } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import type { RestaurantPerformance } from "../types"

interface TopBranchesCardProps {
  branches?: RestaurantPerformance[]
  isLoading?: boolean
}

export function TopBranchesCard({
  branches = [],
  isLoading = false,
}: TopBranchesCardProps) {
  const t = useTranslations("Dashboard.analytics")
  const locale = useLocale()
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US"
  const formatNumber = (val: number) =>
    new Intl.NumberFormat(numberLocale).format(val)

  if (isLoading) {
    return (
      <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-5 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="size-5 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const displayBranches = branches
  const maxCount =
    displayBranches.length > 0
      ? Math.max(...displayBranches.map((b) => b.count), 1)
      : 1

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store className="size-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              {t("topRestaurantsTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("topRestaurantsSub")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 p-0">
        {displayBranches.length > 0 ? (
          displayBranches.map((item, idx) => {
            const fillPercent = Math.min(
              Math.round((item.count / maxCount) * 100),
              100
            )
            const rankNum = item.rank || idx + 1

            return (
              <div
                key={item.id || idx}
                className="flex items-center justify-between gap-3 text-xs font-medium"
              >
                <span className="shrink-0 font-semibold text-muted-foreground">
                  {formatNumber(item.count)}
                </span>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-start text-foreground">
                    <span className="truncate font-semibold">{item.name}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>

                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                  {formatNumber(rankNum)}
                </span>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
            <p>{t("noOrdersData")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


