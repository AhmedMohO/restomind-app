"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RestaurantStatusBadgeProps {
  isActive: boolean
  className?: string
}

export function RestaurantStatusBadge({
  isActive,
  className,
}: RestaurantStatusBadgeProps) {
  const t = useTranslations("Dashboard.restaurant")

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        isActive
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-emerald-500" : "bg-muted-foreground"
        )}
      />
      {isActive ? t("statusOnline") : t("statusOffline")}
    </Badge>
  )
}
