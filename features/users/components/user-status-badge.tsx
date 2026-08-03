"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UserStatusBadgeProps {
  isDeleted?: boolean
  isActive?: boolean
  isEmailVerified?: boolean
  className?: string
}

export function UserStatusBadge({
  isDeleted = false,
  isActive = true,
  isEmailVerified = true,
  className,
}: UserStatusBadgeProps) {
  const t = useTranslations("Dashboard.users")

  if (isDeleted) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border-destructive/40 bg-destructive/10 text-destructive",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-destructive" />
        {t("statusDeleted") || "Deleted"}
      </Badge>
    )
  }

  if (!isActive) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-amber-500" />
        {t("statusInactive") || "Inactive"}
      </Badge>
    )
  }

  if (!isEmailVerified) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
        {t("statusPendingSetup") || "Pending Setup"}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {t("statusActive") || "Active"}
    </Badge>
  )
}

