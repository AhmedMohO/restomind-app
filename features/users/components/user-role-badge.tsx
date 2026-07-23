"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UserRoleBadgeProps {
  role: "admin" | "manager" | "customer" | string
  className?: string
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const t = useTranslations("Dashboard.users")
  const normalizedRole = role.toLowerCase()

  const config = {
    admin: {
      label: t("roleAdmin"),
      className: "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
      dot: "bg-purple-500",
    },
    manager: {
      label: t("roleManager"),
      className: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      dot: "bg-blue-500",
    },
    customer: {
      label: t("roleCustomer"),
      className: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
      dot: "bg-slate-500",
    },
    staff: {
      label: "Staff",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
  }

  const current = config[normalizedRole as keyof typeof config] || {
    label: role,
    className: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize",
        current.className,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", current.dot)} />
      {current.label}
    </Badge>
  )
}
