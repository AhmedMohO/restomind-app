"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UserStatusBadgeProps {
  isDeleted?: boolean
  className?: string
}

export function UserStatusBadge({ isDeleted = false, className }: UserStatusBadgeProps) {
  const t = useTranslations("Dashboard.users")
  const isActive = !isDeleted

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        isActive
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/40 bg-destructive/10 text-destructive",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-emerald-500" : "bg-destructive"
        )}
      />
      {isActive ? t("statusActive") : t("statusDeleted")}
    </Badge>
  )
}
